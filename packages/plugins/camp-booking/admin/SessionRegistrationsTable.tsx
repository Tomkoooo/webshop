"use client"
/* eslint-disable react-hooks/set-state-in-effect -- admin panels fetch lists on mount */

import { Fragment, useCallback, useEffect, useState } from "react"
import { campAdminApi } from "./camp-api"
import { CampAdminLoading } from "./camp-admin-ui"

type CampChildRow = {
  name: string
  lastName?: string
  birthDate: string
  diningOption?: string
  dietaryRequest?: string
  allergies?: string
  laptopRental?: boolean
}

type RegistrationRow = {
  id: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  childCount: number
  totalHuf: number
  ticketTypeName: string
  paidAt: string
  children: CampChildRow[]
}

export function SessionRegistrationsTable({ sessionId }: { sessionId: string }) {
  const [rows, setRows] = useState<RegistrationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    campAdminApi<{ registrations: RegistrationRow[] }>(`sessions/${sessionId}/registrations`)
      .then((d) => {
        setRows(d.registrations)
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [sessionId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <CampAdminLoading />
  }

  if (error) {
    return <p className="text-red-400 text-sm">{error}</p>
  }

  if (rows.length === 0) {
    return (
      <p className="text-neutral-500 text-sm italic">Még nincs fizetett jelentkezés ezen a turnuson.</p>
    )
  }

  return (
    <div className="overflow-x-auto border border-white/10 rounded-2xl">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-neutral-400">
            <th className="p-3">Vásárló</th>
            <th className="p-3 hidden md:table-cell">E-mail</th>
            <th className="p-3 hidden lg:table-cell">Telefon</th>
            <th className="p-3">Gyerekek</th>
            <th className="p-3 hidden sm:table-cell">Jegy</th>
            <th className="p-3">Összeg</th>
            <th className="p-3 hidden md:table-cell">Fizetve</th>
            <th className="p-3 w-20" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const expanded = expandedId === r.id
            return (
              <Fragment key={r.id}>
                <tr
                  className="border-b border-white/5 hover:bg-white/[0.03] text-neutral-200"
                >
                  <td className="p-3 font-medium text-white">{r.buyerName}</td>
                  <td className="p-3 hidden md:table-cell text-neutral-400">{r.buyerEmail}</td>
                  <td className="p-3 hidden lg:table-cell text-neutral-400">{r.buyerPhone}</td>
                  <td className="p-3">{r.childCount}</td>
                  <td className="p-3 hidden sm:table-cell text-neutral-400">{r.ticketTypeName}</td>
                  <td className="p-3 whitespace-nowrap">
                    {r.totalHuf.toLocaleString("hu-HU")} Ft
                  </td>
                  <td className="p-3 hidden md:table-cell text-neutral-500 text-xs whitespace-nowrap">
                    {new Date(r.paidAt).toLocaleString("hu-HU")}
                  </td>
                  <td className="p-3">
                    {r.children.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : r.id)}
                        className="text-[10px] font-black uppercase tracking-widest admin-link-accent"
                      >
                        {expanded ? "Bezár" : "Részletek"}
                      </button>
                    ) : null}
                  </td>
                </tr>
                {expanded && r.children.length > 0 ? (
                  <tr className="border-b border-white/5 bg-black/40">
                    <td colSpan={8} className="p-4">
                      <ul className="space-y-3">
                        {r.children.map((child, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-neutral-300 border-l-2 border-white/20 pl-3"
                          >
                            <p className="font-bold text-white">
                              {child.name}
                              {child.lastName ? ` ${child.lastName}` : ""}
                            </p>
                            <p className="text-neutral-500 mt-0.5">
                              Születés: {child.birthDate}
                              {child.diningOption ? ` · Étkezés: ${child.diningOption}` : ""}
                              {child.laptopRental ? " · Laptop bérlés" : ""}
                            </p>
                            {child.dietaryRequest ? (
                              <p className="text-neutral-500">Étkezési kérés: {child.dietaryRequest}</p>
                            ) : null}
                            {child.allergies ? (
                              <p className="text-neutral-500">Allergia: {child.allergies}</p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
