import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { hospitals, users } from "@/db/schema";
import { getAuthSession } from "@/lib/auth";

const loginSchema = z.object({
  hospitalCode: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        passwordHash: users.passwordHash,
        hospitalId: hospitals.id,
        hospitalCode: hospitals.code,
        hospitalName: hospitals.name,
      })
      .from(users)
      .innerJoin(hospitals, eq(users.hospitalId, hospitals.id))
      .where(and(eq(users.email, body.email), eq(hospitals.code, body.hospitalCode)))
      .limit(1);

    if (!user || user.passwordHash !== body.password) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid hospital, email, or password.",
          },
        },
        { status: 401 }
      );
    }

    const session = await getAuthSession();
    session.isLoggedIn = true;
    session.userId = user.id;
    session.name = user.name;
    session.email = user.email;
    session.role = user.role;
    session.hospitalId = user.hospitalId;
    session.hospitalCode = user.hospitalCode;
    session.hospitalName = user.hospitalName;
    await session.save();

    return NextResponse.json({
      ok: true,
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId,
        hospitalCode: user.hospitalCode,
        hospitalName: user.hospitalName,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "LOGIN_FAILED", message },
      },
      { status: 400 }
    );
  }
}
