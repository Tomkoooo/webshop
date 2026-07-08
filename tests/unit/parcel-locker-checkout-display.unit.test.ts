import { describe, expect, it } from "vitest"
import {
  formatGlsParcelPointLines,
  formatFoxpostParcelPointLines,
  foxpostParcelPointFindmeHtml,
  getOrderParcelDeliveryDisplay,
  getOrderDeliveryLocationHint,
  buildGlsParcelOrderShippingAddress,
  buildFoxpostParcelOrderShippingAddress,
} from "@wse/core/lib/parcel-locker-checkout-display"

describe("parcel locker checkout display", () => {
  it("formats GLS point lines", () => {
    expect(
      formatGlsParcelPointLines({
        id: "1",
        name: "GLS Pont",
        contact: { postalCode: "1011", city: "Budapest", address: "Utca 1" },
      })
    ).toEqual(["GLS Pont", "1011 Budapest Utca 1"])
  })

  it("formats Foxpost point lines without findme (HTML shown separately)", () => {
    expect(
      formatFoxpostParcelPointLines({
        id: "2",
        name: "Foxpost A",
        zip: "4024",
        city: "Debrecen",
        address: "Main 2",
        findme: "Bejárat mögött",
      })
    ).toEqual(["Foxpost A", "4024 Debrecen Main 2"])
  })

  it("exposes Foxpost findme HTML", () => {
    expect(
      foxpostParcelPointFindmeHtml({
        id: "2",
        name: "Foxpost A",
        findme: "<b>Fizetés</b><br/>Kártya",
      })
    ).toBe("<b>Fizetés</b><br/>Kártya")
  })

  it("builds admin parcel delivery display", () => {
    const display = getOrderParcelDeliveryDisplay({
      foxpostParcelPoint: {
        id: "hu5516",
        name: "Fox automata",
        zip: "1111",
        city: "Budapest",
        address: "Utca 2",
      },
    })
    expect(display?.isParcel).toBe(true)
    expect(display?.providerLabel).toBe("Foxpost")
    expect(display?.lines).toContain("Fox automata")
    expect(display?.idLine).toContain("hu5516")
  })

  it("builds GLS order shipping from parcel point address only", () => {
    const ship = buildGlsParcelOrderShippingAddress(
      { name: "Vevo", email: "a@a.com", phone: "06" },
      {
        id: "g1",
        name: "GLS Pont",
        contact: { postalCode: "4024", city: "Debrecen", address: "Piac 1" },
      },
      { label: "Magyarország", code: "HU" }
    )
    expect(ship.street).toBe("Piac 1")
    expect(ship.city).toBe("Debrecen")
    expect(ship.name).toBe("Vevo")
  })

  it("builds Foxpost order shipping from automata address", () => {
    const ship = buildFoxpostParcelOrderShippingAddress(
      { name: "Vevo", email: "a@a.com", phone: "06" },
      { id: "hu5516", name: "Fox", zip: "1111", city: "Bp", address: "Utca 2" },
      { label: "Magyarország", code: "HU" }
    )
    expect(ship.street).toBe("Utca 2")
    expect(ship.zip).toBe("1111")
  })

  it("uses parcel location hint on order list when locker selected", () => {
    expect(
      getOrderDeliveryLocationHint({
        glsParcelPoint: {
          id: "p1",
          name: "GLS Pont",
          contact: { city: "Szeged" },
        },
        shippingAddress: { city: "Budapest" },
      })
    ).toBe("Szeged · GLS Pont")
    expect(getOrderDeliveryLocationHint({ shippingAddress: { city: "Budapest" } })).toBe("Budapest")
  })
})
