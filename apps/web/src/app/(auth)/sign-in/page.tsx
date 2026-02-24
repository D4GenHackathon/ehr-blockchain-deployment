import { LoginForm1 } from "./components/login-form-1"
import { asc } from "drizzle-orm"
import { Logo } from "@/components/logo"
import { db } from "@/db"
import { hospitals } from "@/db/schema"
import Link from "next/link"

export default async function Page() {
  const hospitalOptions = await db
    .select({
      code: hospitals.code,
      name: hospitals.name,
    })
    .from(hospitals)
    .orderBy(asc(hospitals.name))

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md">
            <Logo size={24} />
          </div>
          D4Gen
        </Link>
        <LoginForm1 hospitals={hospitalOptions} />
      </div>
    </div>
  )
}
