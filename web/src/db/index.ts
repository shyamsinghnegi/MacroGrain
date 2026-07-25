import "server-only"
import { drizzle } from "drizzle-orm/sqlite-proxy"
import * as schema from "./schema"

// Cloudflare D1 has no client-library driver usable from a plain Node
// server (drizzle-orm/d1 requires a Worker's native D1Database binding).
// This calls D1's REST query API directly and adapts its response shape
// (rows as {col: val} objects) into what drizzle-orm/sqlite-proxy expects
// (rows as positional value arrays) - confirmed by reading
// drizzle-orm/sqlite-proxy/session.js's mapAllResult/mapGetResult.
async function queryD1(sql: string, params: unknown[]) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_DATABASE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_D1_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    }
  )

  const data = await res.json()

  if (!data.success) {
    const message = data.errors?.[0]?.message ?? "D1 query failed"
    throw new Error(message)
  }

  const rows: Record<string, unknown>[] = data.result?.[0]?.results ?? []
  return { rows: rows.map((row) => Object.values(row)) }
}

export const db = drizzle(
  async (sql, params, method) => {
    const { rows } = await queryD1(sql, params)
    // sqlite-proxy's session.js expects different shapes per method:
    // "get" wants a single flat row directly as `rows` (mapGetResult does
    // `const row = rows` then `!row` to detect "not found" - it does NOT
    // do rows[0] itself). Critically, on zero matches we must return
    // `undefined`, NOT `[]` - an empty array is truthy, so `!row` fails to
    // detect "not found" and mapResultRow() builds a garbage non-null object
    // from it. This exact bug silently broke Auth.js's getUserByAccount:
    // it returned a truthy {emailVerified: null} object instead of null for
    // brand-new sign-ins, so Auth.js took the "user already exists" branch
    // and skipped createUser entirely, inserting a null userId into session.
    // "all"/"values"/"run" want the full array of rows, unchanged.
    if (method === "get") {
      return { rows: rows[0] }
    }
    return { rows }
  },
  { schema }
)
