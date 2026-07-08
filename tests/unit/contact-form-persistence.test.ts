import { beforeEach, describe, expect, it, vi } from "vitest"

const listContactEmailsMock = vi.fn()
const createContactMessageMock = vi.fn()
const updateNotificationStatusMock = vi.fn()
const sendEmailMock = vi.fn()

vi.mock("@wse/core/services/contact-emails", () => ({
  ContactEmailsService: { list: listContactEmailsMock },
}))

vi.mock("@wse/core/services/contact-messages", () => ({
  ContactMessageService: {
    create: createContactMessageMock,
    updateNotificationStatus: updateNotificationStatusMock,
  },
}))

vi.mock("@wse/core/services/mailer", () => ({
  MailerService: { sendEmail: sendEmailMock },
}))

function contactFormData() {
  const formData = new FormData()
  formData.set("name", "Teszt Elek")
  formData.set("email", "teszt@example.com")
  formData.set("message", "Szeretnék érdeklődni a termékről.")
  formData.set("recipientId", "sales")
  return formData
}

describe("submitContactForm persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
    listContactEmailsMock.mockResolvedValue([
      { id: "sales", label: "Értékesítés", email: "sales@example.com" },
    ])
    createContactMessageMock.mockResolvedValue({ _id: "contact-message-1" })
    updateNotificationStatusMock.mockResolvedValue({})
    sendEmailMock.mockResolvedValue({ messageId: "mail-1" })
  })

  it("saves the contact message before sending notification mail", async () => {
    const { submitContactForm } = await import("@wse/core/actions/contact-form")
    const result = await submitContactForm(undefined, contactFormData())

    expect(result.ok).toBe(true)
    expect(createContactMessageMock).toHaveBeenCalledWith({
      name: "Teszt Elek",
      email: "teszt@example.com",
      message: "Szeretnék érdeklődni a termékről.",
      recipientId: "sales",
      recipientLabel: "Értékesítés",
      recipientEmail: "sales@example.com",
    })
    expect(createContactMessageMock.mock.invocationCallOrder[0]).toBeLessThan(
      sendEmailMock.mock.invocationCallOrder[0]
    )
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "sales@example.com",
        templateType: "contact_form_notification",
      })
    )
    expect(updateNotificationStatusMock).toHaveBeenCalledWith("contact-message-1", "sent", undefined)
  })

  it("keeps the visitor success path and records notification failure when SMTP fails", async () => {
    sendEmailMock.mockRejectedValue(
      Object.assign(new Error("domain not registered here"), { responseCode: 550 })
    )

    const { submitContactForm } = await import("@wse/core/actions/contact-form")
    const result = await submitContactForm(undefined, contactFormData())

    expect(result).toEqual({
      ok: true,
      message: "Üzenetét rögzítettük. Hamarosan válaszolunk.",
    })
    expect(updateNotificationStatusMock).toHaveBeenCalledWith(
      "contact-message-1",
      "failed",
      expect.stringContaining("550")
    )
  })

  it("does not attempt email delivery when database persistence fails", async () => {
    createContactMessageMock.mockRejectedValue(new Error("database unavailable"))

    const { submitContactForm } = await import("@wse/core/actions/contact-form")
    const result = await submitContactForm(undefined, contactFormData())

    expect(result.ok).toBe(false)
    expect(sendEmailMock).not.toHaveBeenCalled()
    expect(updateNotificationStatusMock).not.toHaveBeenCalled()
  })
})
