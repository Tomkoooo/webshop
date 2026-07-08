import { beforeEach, describe, expect, it, vi } from "vitest"

const requireAdminMock = vi.fn()
const getByIdMock = vi.fn()
const updateStatusMock = vi.fn()
const createReplyAttemptMock = vi.fn()
const updateReplyStatusMock = vi.fn()
const sendEmailMock = vi.fn()
const revalidatePathMock = vi.fn()

vi.mock("@wse/core/lib/admin-auth", () => ({
  requireAdmin: requireAdminMock,
}))

vi.mock("@wse/core/services/contact-messages", () => ({
  ContactMessageService: {
    getById: getByIdMock,
    updateStatus: updateStatusMock,
    createReplyAttempt: createReplyAttemptMock,
    updateReplyStatus: updateReplyStatusMock,
  },
}))

vi.mock("@wse/core/services/mailer", () => ({
  MailerService: { sendEmail: sendEmailMock },
}))

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}))

function replyFormData() {
  const formData = new FormData()
  formData.set("subject", "Re: Kapcsolatfelvétel")
  formData.set("bodyHtml", "<p>Köszönjük az üzenetet.<br />Hamarosan jelentkezünk.</p>")
  return formData
}

describe("admin contact message replies", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminMock.mockResolvedValue({
      user: { id: "admin-1", name: "Admin", email: "admin@example.com" },
    })
    getByIdMock.mockResolvedValue({
      _id: "message-1",
      name: "Teszt Elek",
      email: "teszt@example.com",
      message: "Eredeti üzenet",
      createdAt: new Date().toISOString(),
    })
    createReplyAttemptMock.mockResolvedValue({ replyId: "reply-1" })
    updateStatusMock.mockResolvedValue(null)
    updateReplyStatusMock.mockResolvedValue({})
    sendEmailMock.mockResolvedValue({ messageId: "mail-1" })
  })

  it("marks unread messages as read when opened without render-time revalidation", async () => {
    getByIdMock.mockResolvedValueOnce({
      _id: "message-1",
      status: "unread",
      name: "Teszt Elek",
      email: "teszt@example.com",
      message: "Eredeti üzenet",
      createdAt: new Date().toISOString(),
    })
    updateStatusMock.mockResolvedValueOnce({ _id: "message-1", status: "read" })

    const { getContactMessage } = await import("@wse/core/actions/admin-contact-messages")
    const result = await getContactMessage("message-1")

    expect(result?.status).toBe("read")
    expect(updateStatusMock).toHaveBeenCalledWith("message-1", "read")
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it("saves a reply attempt before sending and marks it sent", async () => {
    const { sendContactReply } = await import("@wse/core/actions/admin-contact-messages")
    const result = await sendContactReply("message-1", undefined, replyFormData())

    expect(result.ok).toBe(true)
    expect(createReplyAttemptMock).toHaveBeenCalledWith("message-1", {
      subject: "Re: Kapcsolatfelvétel",
      bodyHtml: "<p>Köszönjük az üzenetet.<br />Hamarosan jelentkezünk.</p>",
      bodyText: "Köszönjük az üzenetet.\nHamarosan jelentkezünk.",
      adminUserId: "admin-1",
      adminName: "Admin",
      adminEmail: "admin@example.com",
    })
    expect(createReplyAttemptMock.mock.invocationCallOrder[0]).toBeLessThan(
      sendEmailMock.mock.invocationCallOrder[0]
    )
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "teszt@example.com",
        templateType: "contact_reply",
      })
    )
    expect(updateReplyStatusMock).toHaveBeenCalledWith("message-1", "reply-1", "sent")
  })

  it("marks the saved reply attempt failed when SMTP rejects it", async () => {
    sendEmailMock.mockRejectedValue(
      Object.assign(new Error("domain not registered here"), { responseCode: 550 })
    )

    const { sendContactReply } = await import("@wse/core/actions/admin-contact-messages")
    const result = await sendContactReply("message-1", undefined, replyFormData())

    expect(result).toEqual({
      ok: false,
      message: "A válasz mentve lett, de az email küldése sikertelen.",
    })
    expect(updateReplyStatusMock).toHaveBeenCalledWith(
      "message-1",
      "reply-1",
      "failed",
      expect.stringContaining("550")
    )
  })
})
