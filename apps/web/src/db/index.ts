import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

const dbFilePath = process.env.DATABASE_URL ?? "./sqlite.db";

const sqlite = new Database(dbFilePath);

export const db = drizzle(sqlite, { schema });
export { schema };
