# D4Gen - Decentralized Privacy-Preserving EHR Platform

## Overview

This repository contains the monorepo for D4Gen, a decentralized application designed to enable secure, privacy-preserving management and sharing of Electronic Health Records (EHRs) across medical organizations.

The system allows hospitals, clinics, research institutions, and patients to:

- Store encrypted medical data on decentralized storage
- Control and audit access permissions on-chain
- Share sensitive medical information across organizations
- Prove eligibility or attributes (for example, age or consent) using zero-knowledge proofs without revealing personal data

The architecture combines Sui blockchain, Walrus decentralized storage, Seal access control, and zkSNARKs, with a unified Next.js application serving both frontend and backend logic. This repository is responsible to implement privacy-preserving across-institution of EHR data sharing, with the target to build a complete securing biomedical smart system presented in [D4Gen Hackathon Presentation](https://docs.google.com/presentation/d/1GiAFoziQa2gabl1P-FO_-KVlu5M8lQ-l/edit?slide=id.g3c215db895e_0_522#slide=id.g3c215db895e_0_522).

![Data Secure Tranmission in Blockchain-based Healthcare Systems](docs/general-architecture/architecture.png)

## Product Prototype Version

| Version | Type | Features | Video Demo |
|---|---|---|---|
| Alpha v1.0.1 | Initial Alpha | Basic Functionality (Login, Signup, Dashboard)| [▶ Basic Function View](docs/demo/alpha101.mov) | 
| Alpha v1.0.2 | Alpha Update | Email data sharing, ZKP Verification |[▶ Network Function Demo View](docs/demo/alpha102.mov) | 
| Alpha v1.0.3 | Alpha Update | Full web application functionalities | Upcomming (Hackathon Day) | 

## High-Level Architecture

The repository is structured as a monorepo, separating concerns between:

- Application layer (UI + backend)
- On-chain logic (Move smart contracts)
- Zero-knowledge circuits
- Shared SDK and infrastructure logic

```text
.
├─ apps/
│  ├─ web/              # Main web application (dashboard + backend)
│  ├─ landing/          # Standalone landing page application
│  └─ prover/           # Fallback prover service (rapidsnark target)
├─ packages/
   ├─ contracts/        # Sui Move smart contracts
   ├─ zk-circuits/      # zkSNARK circuits and proving artifacts
   └─ d4gen-sdk/        # Shared TypeScript SDK (Sui, Walrus, Seal, zk)
└─ docs                 # Documentations (ZK Snark circuits, general architecture, etc)
```

## Development Requirements

### Global Requirements (all workspaces)

- Node.js `>=24`
- pnpm `10.x`
- Bash-compatible shell (for script execution)

Install dependencies once at repo root:

```bash
pnpm install
```

### Package-Specific Requirements

- `packages/contracts`
  - Sui CLI installed (verified with `sui --version`)
- `packages/zk-circuits`
  - `cargo` installed (used by `bootstrap` to install `circom` locally when needed)
  - `snarkjs` is installed from workspace dependencies via `pnpm install`
  - `circom` can be either:
    - globally installed in your PATH, or
    - locally installed by `pnpm --filter ./packages/zk-circuits bootstrap`
- `packages/d4gen-sdk`
  - Node.js + pnpm only (current scaffold stage)

## Applications

### apps/web - Web Application (Dashboard + Backend)

This is the main application entry point.

#### Responsibilities

- User-facing UI:
  - Dashboard for patients, hospitals, and organizations
  - Landing pages and product overview
- Backend logic (implemented via Next.js server-side routes):
  - Uploading and retrieving encrypted medical data from decentralized storage
  - Interacting with Sui smart contracts
  - Requesting decryption capabilities via Seal
  - Generating and submitting zero-knowledge proofs
- Lightweight indexing:
  - Reading on-chain events and objects
  - Building queryable views for records, shares, and audit logs
  - Improving UX without exposing sensitive data

#### Key Principles

- No plaintext medical data is persisted on-chain
- Backend logic relies exclusively on shared SDKs
- All cryptographic operations are delegated to dedicated packages

## Packages

### packages/contracts - Sui Move Smart Contracts

This package contains all on-chain logic deployed to the Sui network.

#### Responsibilities

- Definition of EHR record objects (metadata only)
- Access control and sharing logic
- Policy enforcement hooks for Seal
- Verification of zkSNARK proofs on-chain
- Emission of audit events for:
  - Record creation
  - Record sharing
  - Access revocation

#### Design Goals

- Minimal, auditable, and deterministic logic
- No storage of PII or PHI on-chain
- On-chain data acts only as:
  - Pointers
  - Commitments
  - Policies
  - Immutable audit trails

### packages/zk-circuits - Zero-Knowledge Circuits

This package defines all zkSNARK circuits and related artifacts used by the system.

#### Responsibilities

- Definition of zero-knowledge constraints (for example, age eligibility and consent validity)
- Compilation and setup of zkSNARK circuits
- Generation of proofs and public signals
- Export of verification keys compatible with Sui Move verification

#### Design Goals

- Enable selective disclosure of sensitive attributes
- Bind proofs to specific records or policies to prevent reuse
- Keep circuit scope minimal and verifiable within on-chain constraints

### packages/d4gen-sdk - Shared SDK and Infrastructure Layer

This package provides a unified TypeScript SDK used by both frontend and backend code.

#### Responsibilities

- Sui blockchain interaction:
  - Transaction builders
  - Event and object readers
- Walrus storage integration:
  - Encrypted blob upload/download
  - Hashing and commitment helpers
- Seal integration:
  - Client-side encryption helpers
  - Access policy handling
- Zero-knowledge helpers:
  - Proof generation orchestration
  - Formatting proofs and public inputs for on-chain verification
- Shared domain types:
  - Records
  - Policies
  - Audit events
  - Organization and subject identifiers

#### Design Goals

- Single source of truth for protocol-level logic
- Prevent duplication of cryptographic or blockchain code
- Allow future replacement of infrastructure components with minimal refactoring

## How To Run Workspaces

### Root Commands

```bash
pnpm run dev          # run all workspace dev scripts in parallel
pnpm run dev:web      # run only apps/web
pnpm run dev:landing  # run only apps/landing
pnpm run build        # run build for all workspaces via turbo
pnpm run test         # run test for all workspaces via turbo
```

### `packages/contracts` (Sui Move)

```bash
pnpm --filter ./packages/contracts build          # sui move build
pnpm --filter ./packages/contracts test           # sui move test
pnpm --filter ./packages/contracts test:coverage  # sui move test --coverage
pnpm --filter ./packages/contracts check          # build + test
```

Current example module:
- `d4gen::ehr` with record creation, consent update, share, and delete flows
- Includes Move unit tests that pass with `pnpm --filter ./packages/contracts check`

### `packages/zk-circuits` (Groth16 / circom / snarkjs)

First-time setup:

```bash
pnpm --filter ./packages/zk-circuits bootstrap
```

Run pipeline:

```bash
pnpm --filter ./packages/zk-circuits build       # compile + setup
pnpm --filter ./packages/zk-circuits test        # prove + verify
pnpm --filter ./packages/zk-circuits export:vkey # export move-friendly vkey json
pnpm --filter ./packages/zk-circuits full        # build + test + export:vkey
```

Current example circuit:
- `private_multiplier.circom` proves knowledge of private `a`, `b` such that `a * b = product` (public)

Main generated outputs:
- `packages/zk-circuits/artifacts/private_multiplier/proof.json`
- `packages/zk-circuits/artifacts/private_multiplier/public.json`
- `packages/zk-circuits/artifacts/private_multiplier/verification_key.json`
- `packages/zk-circuits/artifacts/private_multiplier/verification_key.move.json`

### `packages/d4gen-sdk` (TypeScript SDK)

Current SDK workspace is scaffolded and ready for next implementation phase.

```bash
pnpm --filter ./packages/d4gen-sdk build
pnpm --filter ./packages/d4gen-sdk test
pnpm --filter ./packages/d4gen-sdk typecheck
```

### `apps/prover` (Rust Prover Service)

`apps/prover` is a standalone Rust service that manages proof jobs and executes:

1. witness generation (`generate_witness.js`)
2. Groth16 proof generation using `rapidsnark prover`

Run:

```bash
pnpm --filter ./apps/prover dev
pnpm --filter ./apps/prover start
```

Key endpoints:

- `GET /health`, `GET /healthz`
- `GET /readyz`
- `POST /v1/proofs`
- `GET /v1/proofs/:job_id`
- `POST /v1/proofs/:job_id/cancel`

Required environment variables:

- `PROVER_SERVICE_URL` for `apps/web` to call the prover service
- `RAPIDSNARK_PROVER_BIN` for `apps/prover` to locate the `prover` binary

Optional security:

- set `PROVER_INTERNAL_AUTH_TOKEN` in both `apps/prover` and `apps/web`
  (`apps/web` sends it via `x-prover-token`)

Install and build `rapidsnark` standalone prover (example for macOS arm64):

```bash
cd /Users/vuonghuuhung/Code
git clone https://github.com/iden3/rapidsnark.git
cd rapidsnark
git submodule update --init --recursive
./build_gmp.sh macos_arm64
make macos_arm64
```

Then run local prover flow:

```bash
pnpm --filter ./packages/zk-circuits bootstrap
pnpm --filter ./packages/zk-circuits build

export RAPIDSNARK_PROVER_BIN="/Users/vuonghuuhung/Code/rapidsnark/package_macos_arm64/bin/prover"
export PROVER_INTERNAL_AUTH_TOKEN="dev-secret"
pnpm --filter ./apps/prover dev
```

In another terminal, submit an example proof:

```bash
curl -X POST "http://localhost:7301/v1/proofs" \
  -H "content-type: application/json" \
  -H "x-prover-token: dev-secret" \
  -d '{
    "request_id": "req-1",
    "circuit_id": "private_multiplier",
    "input": { "a": "3", "b": "11", "product": "33" }
  }'
```

See `apps/prover/README.md` for complete end-to-end steps (health checks and status polling).

## Core Design Principles

### Privacy by design

No personally identifiable or medical data is stored on-chain.

### Decentralized storage, centralized UX

Data is decentralized and encrypted, while the application provides a coherent user experience.

### Explicit access control

All data access is gated by on-chain policies and auditable events.

### Verifiable compliance

Zero-knowledge proofs allow compliance checks without disclosure.

### Pragmatic architecture

Designed to be implemented end-to-end within a short development cycle while remaining extensible.

## Intended Scope

This repository is designed as:

- A functional end-to-end prototype
- A foundation for a consortium-based medical data sharing system
- A reference architecture for privacy-preserving data sharing on Sui

It intentionally avoids over-engineering while preserving correctness and extensibility.
