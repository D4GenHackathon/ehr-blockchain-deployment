import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";

export async function GET() {
  const session = await getAuthSession();

  if (!session.isLoggedIn || !session.userId || !session.hospitalId) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Not authenticated.",
        },
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      userId: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
      hospitalId: session.hospitalId,
      hospitalCode: session.hospitalCode,
      hospitalName: session.hospitalName,
    },
  });
}
