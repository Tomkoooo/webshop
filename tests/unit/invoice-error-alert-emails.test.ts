import { describe, expect, it } from "vitest";
import {
  parseInvoiceErrorAlertEmailsFromShopContent,
  serializeInvoiceErrorAlertEmails,
} from "@wse/core/lib/invoice-error-alert-emails";

describe("invoice error alert emails", () => {
  it("parses JSON array and dedupes", () => {
    const emails = parseInvoiceErrorAlertEmailsFromShopContent({
      invoice_error_alert_emails: JSON.stringify([
        "ops@test.com",
        "ops@test.com",
        "bad",
        "finance@test.com",
      ]),
    });
    expect(emails).toEqual(["ops@test.com", "finance@test.com"]);
  });

  it("returns empty for missing or invalid JSON", () => {
    expect(parseInvoiceErrorAlertEmailsFromShopContent({})).toEqual([]);
    expect(
      parseInvoiceErrorAlertEmailsFromShopContent({ invoice_error_alert_emails: "not-json" })
    ).toEqual([]);
  });

  it("serializes valid emails only", () => {
    const raw = serializeInvoiceErrorAlertEmails([" a@test.com ", "invalid", "b@test.com", "a@test.com"]);
    expect(JSON.parse(raw)).toEqual(["a@test.com", "b@test.com"]);
  });
});
