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
  // JWT (not "database") sessions: every navigation calls auth(), and a
  // database session strategy means every single one of those pays for a
  // D1 REST round-trip just to look up the session row. D1 has no local
  // connection to pool, so that round-trip is a real cross-network hit on
  // every page load. The JWT itself still comes from sign-in via the
  // DrizzleAdapter (so the user/account tables are still used normally),
  // this only changes how the *session* is validated afterwards.
  session: { strategy: "jwt" },
  callbacks: {
    // The adapter normally stamps `session.user.id` for free in "database"
    // mode by reading the session row's userId. In "jwt" mode nothing does
    // that automatically, so it has to be threaded through by hand: jwt()
    // copies the id onto the token at sign-in, session() copies it back off
    // the token onto the session object every request that's genuinely
    // free (no DB call, no network hop).
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id
      }
      return session
    },
  },
  // Auth.js v5 auto-trusts the request host in dev mode, but requires this
  // explicitly in production (`next start`) - without it, every auth
  // request throws "UntrustedHost" and sign-in is completely broken
  // (confirmed: this is exactly what happened running a local production
  // build). Safe to leave on here since this app isn't behind a reverse
  // proxy where the Host header could be spoofed by an untrusted client -
  // if that ever changes, this should be reconsidered.
  trustHost: true,
})
