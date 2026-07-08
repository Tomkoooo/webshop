import { describe, expect, it } from "vitest";
import { mapProductionApmEntry } from "@wse/core/lib/foxpost-apm-catalog";

describe("foxpost-apm-catalog", () => {
  it("maps production APM and filters closed points", () => {
    const open = mapProductionApmEntry({
      operator_id: "hu5356",
      place_id: 123,
      name: "FOXPOST A-BOX Test",
      address: "6722 Szeged, Tisza Lajos krt. 41.",
      zip: "6722",
      city: "Szeged",
      country: "hu",
      service: ["pick up", "dispatch"],
      closeDate: "",
    });
    expect(open).toMatchObject({
      id: "hu5356",
      name: "FOXPOST A-BOX Test",
      city: "Szeged",
      countryCode: "HU",
    });

    const closed = mapProductionApmEntry({
      operator_id: "hu9999",
      name: "Closed",
      closeDate: "2026-01-01",
      service: ["pick up"],
    });
    expect(closed).toBeNull();
  });

  it("filters pickup-only incompatible service points", () => {
    const dispatchOnly = mapProductionApmEntry({
      operator_id: "hu123",
      name: "Dispatch only",
      service: ["dispatch"],
      closeDate: "",
    });
    expect(dispatchOnly).not.toBeNull();

    const receiveOnly = mapProductionApmEntry({
      operator_id: "hu124",
      name: "Receive only",
      service: ["receive"],
      closeDate: "",
    });
    expect(receiveOnly).toBeNull();
  });
});
