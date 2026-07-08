"use client"

import { useState } from "react"
import { setStoredToken } from "../lib/use-core-admin-api"

export function TokenGate({ onSaved }: { onSaved: () => void }) {
  const [token, setToken] = useState("")
  return (
    <div className="mx-auto max-w-sm space-y-3 rounded-xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-sm font-bold text-white">Operator token</h2>
      <p className="text-xs text-neutral-400">
        Enter the CORE_ADMIN_ACCESS_TOKEN configured on this control plane.
      </p>
      <input
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="w-full rounded border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
      />
      <button
        type="button"
        onClick={() => {
          setStoredToken(token)
          onSaved()
        }}
        className="w-full rounded bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-neutral-200"
      >
        Save
      </button>
    </div>
  )
}
