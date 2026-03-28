import { WALRUS_AGGREGATOR_URL, WALRUS_PUBLISHER_URL, WALRUS_DEFAULT_EPOCHS } from "./seal-config";

export interface WalrusUploadResult {
  blobId: string;
  objectId: string;
  alreadyCertified: boolean;
}

/**
 * Upload raw bytes to Walrus via the free testnet publisher REST API.
 * Returns the blobId assigned by Walrus.
 * On testnet, the publisher covers the WAL storage cost.
 */
export async function walrusUpload(
  data: Uint8Array,
  epochs = WALRUS_DEFAULT_EPOCHS
): Promise<WalrusUploadResult> {
  const url = `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=${epochs}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/octet-stream" },
    // ArrayBuffer is universally accepted as BodyInit across environments
    body: data.buffer as ArrayBuffer,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Walrus upload failed (${response.status}): ${text}`);
  }

  const json = await response.json() as {
    newlyCreated?: { blobObject: { id: string; blobId: string } };
    alreadyCertified?: { blobId: string; eventOrObject?: { id?: string } };
  };

  if (json.newlyCreated) {
    return {
      blobId: json.newlyCreated.blobObject.blobId,
      objectId: json.newlyCreated.blobObject.id,
      alreadyCertified: false,
    };
  }
  if (json.alreadyCertified) {
    return {
      blobId: json.alreadyCertified.blobId,
      objectId: json.alreadyCertified.eventOrObject?.id ?? "",
      alreadyCertified: true,
    };
  }

  throw new Error("Unexpected Walrus publisher response: " + JSON.stringify(json));
}

/**
 * Download a blob from the Walrus testnet aggregator.
 * Returns raw bytes, or null if the blob was not found.
 */
export async function walrusDownload(blobId: string): Promise<Uint8Array> {
  const url = `${WALRUS_AGGREGATOR_URL}/v1/blobs/${encodeURIComponent(blobId)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Walrus download failed (${response.status}) for blob ${blobId}`);
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}
