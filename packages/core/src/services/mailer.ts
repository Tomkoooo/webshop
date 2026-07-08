import nodemailer from "nodemailer";
import handlebars from "handlebars";
import dbConnect from "@wse/core/lib/db";
import { formatEmailFromHeader } from "@wse/core/lib/email-from";
import {
  getMailerSmtpConfigSummary,
  logMailer,
  serializeMailerError,
  warnIfMailerEnvIncomplete,
} from "@wse/core/lib/mailer-log";
import EmailTemplate from "@wse/core/models/EmailTemplate";

export interface MailOptions {
  to: string;
  templateType: string;
  data: Record<string, any>;
  attachments?: {
    filename: string;
    content: Buffer;
    contentType?: string;
  }[];
  /** Extra fields included in server logs (e.g. orderId, flow). */
  logContext?: Record<string, unknown>;
}

export interface SystemHtmlMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  logContext?: Record<string, unknown>;
}

function maskEmail(email: string): string {
  const trimmed = String(email || "").trim();
  const at = trimmed.indexOf("@");
  if (at <= 1) return "***";
  return `${trimmed.slice(0, 2)}***${trimmed.slice(at)}`;
}

export const MailerService = {
  async getTransporter() {
    warnIfMailerEnvIncomplete();
    const user = process.env.EMAIL_USER || "test@example.com";
    const pass = process.env.EMAIL_PASS || "password";
    const host = process.env.EMAIL_HOST || "smtp.example.com";
    const port = parseInt(process.env.EMAIL_PORT || "587", 10);

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    if (process.env.MAILER_VERIFY_SMTP === "1") {
      try {
        await transporter.verify();
        logMailer("info", "smtp_verify_ok", { smtp: getMailerSmtpConfigSummary() });
      } catch (error) {
        logMailer("error", "smtp_verify_failed", {
          smtp: getMailerSmtpConfigSummary(),
          error: serializeMailerError(error),
        });
        throw error;
      }
    }

    return transporter;
  },

  async sendEmail({ to, templateType, data, attachments, logContext }: MailOptions) {
    const smtp = getMailerSmtpConfigSummary();
    const ctx = { kind: "template", templateType, to: maskEmail(to), ...logContext };

    logMailer("info", "send_start", { ...ctx, smtp });

    try {
      await dbConnect();

      const template = await EmailTemplate.findOne({ type: templateType }).lean();
      if (!template) {
        logMailer("error", "template_not_found", { ...ctx, templateType });
        throw new Error(`Email template not found: ${templateType}`);
      }

      const compiledSubject = handlebars.compile(template.subject)(data);
      const compiledBody = handlebars.compile(template.body)(data);

      logMailer("info", "template_compiled", {
        ...ctx,
        subjectLength: compiledSubject.length,
        bodyLength: compiledBody.length,
        attachmentCount: attachments?.length ?? 0,
      });

      const transporter = await this.getTransporter();

      const info = await transporter.sendMail({
        from: formatEmailFromHeader(),
        to,
        subject: compiledSubject,
        html: compiledBody,
        attachments,
      });

      logMailer("info", "send_success", {
        ...ctx,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: typeof info.response === "string" ? info.response.slice(0, 300) : info.response,
      });

      return info;
    } catch (error) {
      logMailer("error", "send_failed", {
        ...ctx,
        smtp,
        error: serializeMailerError(error),
      });
      throw error;
    }
  },

  /** Operational / alert mail without DB-backed EmailTemplate (e.g. invoice failures). */
  async sendSystemHtmlEmail({ to, subject, html, text, logContext }: SystemHtmlMailOptions) {
    const smtp = getMailerSmtpConfigSummary();
    const ctx = {
      kind: "system_html",
      to: maskEmail(to),
      subjectPreview: subject.slice(0, 120),
      ...logContext,
    };

    logMailer("info", "send_start", { ...ctx, smtp });

    try {
      const transporter = await this.getTransporter();
      const info = await transporter.sendMail({
        from: formatEmailFromHeader(),
        to,
        subject,
        html,
        text,
      });

      logMailer("info", "send_success", {
        ...ctx,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: typeof info.response === "string" ? info.response.slice(0, 300) : info.response,
      });

      return info;
    } catch (error) {
      logMailer("error", "send_failed", {
        ...ctx,
        smtp,
        error: serializeMailerError(error),
      });
      throw error;
    }
  },
};
