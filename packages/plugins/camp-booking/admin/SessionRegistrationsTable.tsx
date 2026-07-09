"use client"
/* eslint-disable react-hooks/set-state-in-effect -- admin panels fetch lists on mount */

import { Fragment, useCallback, useEffect, useState } from "react"
import { campAdminApi } from "./camp-api"
import { CampAdminLoading } from "./camp-admin-ui"
import { adminTableHead, adminTableWrap } from "@wse/core/lib/admin-ui"

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
    return <p className="text-destructive text-sm">{error}</p>
  }

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm italic">Még nincs fizetett jelentkezés ezen a turnuson.</p>
    )
  }

  return (
    <div className={adminTableWrap}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className={`border-b border-border bg-muted/40 ${adminTableHead}`}>
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
                <tr className="border-b border-border/60 hover:bg-muted/40">
                  <td className="p-3 font-medium text-foreground">{r.buyerName}</td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{r.buyerEmail}</td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground">{r.buyerPhone}</td>
                  <td className="p-3">{r.childCount}</td>
                  <td className="p-3 hidden sm:table-cell text-muted-foreground">{r.ticketTypeName}</td>
                  <td className="p-3 whitespace-nowrap">
                    {r.totalHuf.toLocaleString("hu-HU")} Ft
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(r.paidAt).toLocaleString("hu-HU")}
                  </td>
                  <td className="p-3">
                    {r.children.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : r.id)}
                        className="text-xs font-medium admin-link-accent"
                      >
                        {expanded ? "Bezár" : "Részletek"}
                      </button>
                    ) : null}
                  </td>
                </tr>
                {expanded && r.children.length > 0 ? (
                  <tr className="border-b border-border/60 bg-muted/30">
                    <td colSpan={8} className="p-4">
                      <ul className="space-y-3">
                        {r.children.map((child, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-muted-foreground border-l-2 border-border pl-3"
                          >
                            <p className="font-medium text-foreground">
                              {child.name}
                              {child.lastName ? ` ${child.lastName}` : ""}
                            </p>
                            <p className="mt-0.5">
                              Születés: {child.birthDate}
                              {child.diningOption ? ` · Étkezés: ${child.diningOption}` : ""}
                              {child.laptopRental ? " · Laptop bérlés" : ""}
                            </p>
                            {child.dietaryRequest ? (
                              <p>Étkezési kérés: {child.dietaryRequest}</p>
                            ) : null}
                            {child.allergies ? (
                              <p>Allergia: {child.allergies}</p>
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
