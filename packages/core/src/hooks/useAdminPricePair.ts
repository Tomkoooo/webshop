"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { deriveNetFromGross, grossToNet, netToGross } from "@wse/core/lib/pricing"

export type PriceEditedField = "net" | "gross"

export function useAdminPricePair(
  initialNet: number,
  vatPercent: number,
  initialGross?: number
) {
  const [netPrice, setNetPriceState] = useState(Number(initialNet) || 0)
  const [grossPrice, setGrossPriceState] = useState(() => {
    if (initialGross != null && initialGross > 0) return Number(initialGross)
    return netToGross(Number(initialNet) || 0, vatPercent)
  })
  const [priceEdited, setPriceEdited] = useState<PriceEditedField>("net")

  const setNetPrice = useCallback(
    (net: number) => {
      const n = Number(net) || 0
      setNetPriceState(n)
      setGrossPriceState(netToGross(n, vatPercent))
      setPriceEdited("net")
    },
    [vatPercent]
  )

  const setGrossPrice = useCallback(
    (gross: number) => {
      const g = Number(gross) || 0
      setGrossPriceState(g)
      setNetPriceState(deriveNetFromGross(g, vatPercent))
      setPriceEdited("gross")
    },
    [vatPercent]
  )

  const prevVatRef = useRef(vatPercent)
  useEffect(() => {
    if (prevVatRef.current === vatPercent) return
    prevVatRef.current = vatPercent
    if (priceEdited === "gross") {
      setNetPriceState(deriveNetFromGross(grossPrice, vatPercent))
    } else {
      setGrossPriceState(netToGross(netPrice, vatPercent))
    }
  }, [vatPercent, priceEdited, grossPrice, netPrice])

  return {
    netPrice,
    grossPrice,
    priceEdited,
    setNetPrice,
    setGrossPrice,
  }
}
