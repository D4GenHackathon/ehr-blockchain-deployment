import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export type AuthRole = "admin" | "doctor" | "staff";

export interface AuthSessionData {
  isLoggedIn: boolean;
  userId?: string;
  name?: string;
  hospitalId?: string;
  hospitalCode?: string;
  hospitalName?: string;
  email?: string;
  role?: AuthRole;
}

const sessionPassword =
  process.env.AUTH_SESSION_SECRET ?? "dev_only_change_this_session_secret_32_chars_min";

export const authSessionOptions: SessionOptions = {
  cookieName: "d4gen_session",
  password: sessionPassword,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    httpOnly: true,
    path: "/",
  },
};

export async function getAuthSession() {
  const cookieStore = await cookies();
  return getIronSession<AuthSessionData>(cookieStore, authSessionOptions);
}

export async function requireAuthSession() {
  const session = await getAuthSession();
  if (!session.isLoggedIn || !session.userId || !session.hospitalId) {
    return null;
  }
  return session;
}
