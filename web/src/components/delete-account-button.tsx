"use client"

import { useState } from "react"
import { deleteAccount } from "@/app/settings/actions"

const CONFIRM_WORD = "DELETE"

// Deletion is permanent and irreversible (see deleteAccount in
// settings/actions.ts - it removes every row tied to the account, not just
// a soft-disable flag), so this deliberately asks the user to type a
// confirmation word rather than just a second click - a modal "Are you
// sure?" is too easy to reflexively dismiss-confirm without reading it.
//
// The actual delete runs as a real <form action> (same pattern as the sign
// out button elsewhere in Settings), not a plain async function call from a
// click handler - deleteAccount ends by calling next-auth's signOut(),
// which redirects by throwing internally, and a form action lets Next.js's
// own submission handling carry that redirect through cleanly instead of
// it needing to be told apart from a real error in a client-side try/catch.
export function DeleteAccountButton() {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-center text-xs text-text-faint underline decoration-dotted underline-offset-2 transition-colors hover:text-warning"
      >
        Delete account
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border border-warning/40 bg-warning/5 p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-warning">Delete your account?</p>
        <p className="text-xs text-text-muted">
          This permanently deletes your profile, food/weight/water logs, and
          all other data tied to your account. This can&apos;t be undone.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] text-text-faint uppercase tracking-widest">
          Type {CONFIRM_WORD} to confirm
        </span>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="rounded-input border border-hairline bg-surface px-3 py-2 text-sm text-text outline-none focus:border-warning"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setConfirmText("")
          }}
          className="flex-1 rounded-pill border-[1.5px] border-hairline px-4 py-2 text-sm text-text-muted transition-colors hover:border-text-faint"
        >
          Cancel
        </button>
        <form action={deleteAccount} className="flex-1">
          <button
            type="submit"
            disabled={confirmText !== CONFIRM_WORD}
            className="w-full rounded-pill bg-warning px-4 py-2 text-sm font-medium text-bg transition-opacity disabled:opacity-40"
          >
            Delete permanently
          </button>
        </form>
      </div>
    </div>
  )
}
