import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import { users, accounts, sessions, verificationTokens } from "@/db/schema"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "database" },
  // Auth.js v5 auto-trusts the request host in dev mode, but requires this
  // explicitly in production (`next start`) - without it, every auth
  // request throws "UntrustedHost" and sign-in is completely broken
  // (confirmed: this is exactly what happened running a local production
  // build). Safe to leave on here since this app isn't behind a reverse
  // proxy where the Host header could be spoofed by an untrusted client -
  // if that ever changes, this should be reconsidered.
  trustHost: true,
})
