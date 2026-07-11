import { auth, signIn, signOut } from "@/auth"

export default async function Home() {
  const session = await auth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-zinc-50">
      {session?.user ? (
        <>
          <p>Signed in as {session.user.email}</p>
          <form
            action={async () => {
              "use server"
              await signOut()
            }}
          >
            <button className="rounded-full bg-zinc-50 px-5 py-2 text-black">
              Sign out
            </button>
          </form>
        </>
      ) : (
        <form
          action={async () => {
            "use server"
            await signIn("google")
          }}
        >
          <button className="rounded-full bg-zinc-50 px-5 py-2 text-black">
            Sign in with Google
          </button>
        </form>
      )}
    </div>
  )
}
