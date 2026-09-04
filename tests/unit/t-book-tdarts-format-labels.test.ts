import { describe, expect, it } from "vitest"
import {
  tdartsBoardTypeLabel,
  tdartsFormatLabel,
  tdartsOpennessLabel,
  tdartsParticipationModeInfo,
  tdartsStatusInfo,
} from "@wse/plugin-t-book/lib/tdarts-format-labels"

describe("tdartsFormatLabel", () => {
  it("labels the three known formats in English and Hungarian", () => {
    expect(tdartsFormatLabel("group", "en")).toBe("Group stage")
    expect(tdartsFormatLabel("knockout", "en")).toBe("Knockout")
    expect(tdartsFormatLabel("group_knockout", "en")).toBe("Group stage + knockout")
    expect(tdartsFormatLabel("group_knockout", "hu")).toBe("Csoportkör + egyenes kiesés")
  })

  it("normalizes hyphenated/mixed-case input", () => {
    expect(tdartsFormatLabel("Group-Knockout", "en")).toBe("Group stage + knockout")
  })

  it("returns null for unrecognized formats", () => {
    expect(tdartsFormatLabel("swiss_ladder", "en")).toBeNull()
    expect(tdartsFormatLabel(null, "en")).toBeNull()
  })
})

describe("tdartsParticipationModeInfo", () => {
  it("maps every known mode to a label + tone", () => {
    expect(tdartsParticipationModeInfo("individual", "en")).toEqual({ label: "Singles", tone: "muted" })
    expect(tdartsParticipationModeInfo("pair", "en")).toEqual({ label: "Doubles", tone: "violet" })
    expect(tdartsParticipationModeInfo("lucky_pairs", "en")).toEqual({ label: "Lucky doubles", tone: "fuchsia" })
    expect(tdartsParticipationModeInfo("team", "en")).toEqual({ label: "Team", tone: "emerald" })
    expect(tdartsParticipationModeInfo("swiss", "en")).toEqual({ label: "Swiss system", tone: "indigo" })
  })

  it("returns null for an unknown mode", () => {
    expect(tdartsParticipationModeInfo("relay", "en")).toBeNull()
  })
})

describe("tdartsStatusInfo", () => {
  it.each([
    ["pending", "upcoming"],
    ["active", "live"],
    ["in_progress", "live"],
    ["group-stage", "live"],
    ["knockout", "live"],
    ["finished", "finished"],
    ["cancelled", "finished"],
    ["something_unmapped", "upcoming"],
  ])("maps raw status %s -> tone %s", (raw, tone) => {
    expect(tdartsStatusInfo(raw, "en").tone).toBe(tone)
  })
})

describe("tdartsOpennessLabel / tdartsBoardTypeLabel", () => {
  it("labels openness", () => {
    expect(tdartsOpennessLabel("open", "en")).toBe("Open")
    expect(tdartsOpennessLabel("amateur", "en")).toBe("Amateur")
    expect(tdartsOpennessLabel("unknown", "en")).toBeNull()
  })

  it("labels board type", () => {
    expect(tdartsBoardTypeLabel("steel", "en")).toBe("Steel tip")
    expect(tdartsBoardTypeLabel("soft", "en")).toBe("Soft tip")
    expect(tdartsBoardTypeLabel(null, "en")).toBeNull()
  })
})
