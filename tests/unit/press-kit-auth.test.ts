import { describe, expect, it, vi, beforeEach } from "vitest"
import { hashPassword } from "@wse/core/lib/password"

const mockFindOne = vi.fn()
const mockFindById = vi.fn()

vi.mock("@wse/core/lib/db", () => ({ default: vi.fn() }))
vi.mock("@wse/plugin-press-kit/models/PressContact", () => ({
  default: {
    findOne: (...args: unknown[]) => mockFindOne(...args),
    findById: (...args: unknown[]) => mockFindById(...args),
    findByIdAndUpdate: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    deleteMany: vi.fn(),
  },
}))
vi.mock("@wse/plugin-press-kit/models/PressKitSettings", () => ({
  default: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
}))
vi.mock("@wse/plugin-press-kit/models/PressKitAccessLog", () => ({
  default: { create: vi.fn(), aggregate: vi.fn(), countDocuments: vi.fn() },
}))
vi.mock("@wse/core/services/branding-settings", () => ({
  BrandingSettingsService: { get: vi.fn() },
}))
vi.mock("@wse/core/services/mailer", () => ({ MailerService: { sendEmail: vi.fn() } }))
vi.mock("@wse/core/services/media", () => ({ MediaService: { getFilePayload: vi.fn() } }))

import { PressKitService } from "@wse/plugin-press-kit/services/press-kit-service"

describe("PressKitService.authenticate", () => {
  beforeEach(() => {
    mockFindOne.mockReset()
    mockFindById.mockReset()
  })

  it("authenticates unique_link with token only when no contact password", async () => {
    mockFindOne.mockResolvedValueOnce({
      _id: "c1",
      email: "press@example.com",
      accessToken: "tok123",
      isActive: true,
      passwordHash: undefined,
    })

    const result = await PressKitService.authenticate({
      accessMode: "unique_link",
      token: "tok123",
    })
    expect(result?.email).toBe("press@example.com")
  })

  it("authenticates shared_password with email and shared secret", async () => {
    const shared = "SharedPress99"
    mockFindOne.mockResolvedValueOnce({
      _id: "c2",
      email: "shared@example.com",
      isActive: true,
    })

    const result = await PressKitService.authenticate({
      accessMode: "shared_password",
      email: "shared@example.com",
      password: shared,
      sharedPasswordHash: hashPassword(shared),
    })
    expect(result?.email).toBe("shared@example.com")
  })

  it("authenticates password_per_contact", async () => {
    const plain = "ContactPass88"
    mockFindOne.mockResolvedValueOnce({
      _id: "c3",
      email: "per@example.com",
      isActive: true,
      passwordHash: hashPassword(plain),
    })

    const result = await PressKitService.authenticate({
      accessMode: "password_per_contact",
      email: "per@example.com",
      password: plain,
    })
    expect(result?.email).toBe("per@example.com")
  })

  it("rejects wrong password", async () => {
    mockFindOne.mockResolvedValueOnce({
      _id: "c4",
      email: "per@example.com",
      isActive: true,
      passwordHash: hashPassword("correct"),
    })

    const result = await PressKitService.authenticate({
      accessMode: "password_per_contact",
      email: "per@example.com",
      password: "wrong",
    })
    expect(result).toBeNull()
  })
})
