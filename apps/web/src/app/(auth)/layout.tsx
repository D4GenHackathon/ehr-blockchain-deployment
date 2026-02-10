import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - D4Gen",
  description: "Sign in to D4Gen console or request a workspace account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
