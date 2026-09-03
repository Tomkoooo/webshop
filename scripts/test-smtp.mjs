#!/usr/bin/env node
/**
 * SMTP connection + send diagnostic.
 *
 * Usage:
 *   EMAIL_HOST=smtp.gmail.com \
 *   EMAIL_PORT=465 \
 *   EMAIL_USER=office@magyardarts.hu \
 *   EMAIL_PASS='your-password-or-app-password' \
 *   EMAIL_FROM=office@magyardarts.hu \
 *   EMAIL_FROM_NAME='World Darts Festival' \
 *   EMAIL_TO=you@example.com \
 *   node scripts/test-smtp.mjs
 *
 * Options:
 *   --verify-only   Only run transporter.verify() (no send)
 *   --also-587      Also try port 587 / STARTTLS after 465
 *   --to=addr       Override EMAIL_TO
 *
 * Gmail / Google Workspace notes:
 *   - Personal Gmail + password usually fails; use an App Password
 *     (Google Account → Security → 2-Step Verification → App passwords).
 *   - Google Workspace custom domains need the account password or an
 *     App Password if 2FA is on; "less secure apps" is gone.
 *   - Port 465 = implicit TLS (secure: true)
 *   - Port 587 = STARTTLS (secure: false)
 */

import nodemailer from "nodemailer";

function arg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function mask(value) {
  const s = String(value || "");
  if (!s) return "(empty)";
  if (s.length <= 4) return "***";
  return `${s.slice(0, 2)}***${s.slice(-2)}`;
}

function formatFrom(email, name) {
  const e = String(email || "").trim();
  const n = String(name || "").trim();
  if (!n) return e;
  const escaped = n.replace(/"/g, '\\"');
  return `"${escaped}" <${e}>`;
}

function serializeError(err) {
  if (!err || typeof err !== "object") return { message: String(err) };
  return {
    message: err.message,
    code: err.code,
    command: err.command,
    response: err.response,
    responseCode: err.responseCode,
    errno: err.errno,
    syscall: err.syscall,
    address: err.address,
    port: err.port,
  };
}

async function probe({ host, port, user, pass, from, fromName, to, send }) {
  const secure = port === 465;
  console.log("\n────────────────────────────────────────");
  console.log(`Probing ${host}:${port} (secure=${secure})`);
  console.log(`  user: ${user}`);
  console.log(`  pass: ${mask(pass)}`);
  console.log(`  from: ${formatFrom(from, fromName)}`);
  if (send) console.log(`  to:   ${to}`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 30_000,
    tls: {
      // Helpful diagnostics; still validates certs by default.
      servername: host,
    },
    logger: true,
    debug: true,
  });

  console.log("\n[1/2] transporter.verify() …");
  try {
    await transporter.verify();
    console.log("✓ SMTP verify OK — auth and TLS handshake succeeded.");
  } catch (err) {
    console.error("✗ SMTP verify FAILED");
    console.error(JSON.stringify(serializeError(err), null, 2));
    return { ok: false, stage: "verify", error: err };
  }

  if (!send) {
    console.log("Skipping send (--verify-only).");
    return { ok: true, stage: "verify" };
  }

  console.log("\n[2/2] sendMail() …");
  try {
    const info = await transporter.sendMail({
      from: formatFrom(from, fromName),
      to,
      subject: `[SMTP test] ${fromName || from} — ${new Date().toISOString()}`,
      text: [
        "This is a test message from scripts/test-smtp.mjs.",
        "",
        `Host: ${host}`,
        `Port: ${port}`,
        `User: ${user}`,
        `Time: ${new Date().toISOString()}`,
      ].join("\n"),
      html: `<p>This is a test message from <code>scripts/test-smtp.mjs</code>.</p>
<p><strong>Host:</strong> ${host}<br/>
<strong>Port:</strong> ${port}<br/>
<strong>User:</strong> ${user}<br/>
<strong>Time:</strong> ${new Date().toISOString()}</p>`,
    });

    console.log("✓ sendMail accepted by server");
    console.log(
      JSON.stringify(
        {
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected,
          pending: info.pending,
          response: info.response,
          envelope: info.envelope,
        },
        null,
        2,
      ),
    );
    return { ok: true, stage: "send", info };
  } catch (err) {
    console.error("✗ sendMail FAILED");
    console.error(JSON.stringify(serializeError(err), null, 2));
    return { ok: false, stage: "send", error: err };
  } finally {
    transporter.close();
  }
}

function hintForError(err) {
  const code = err?.code;
  const response = String(err?.response || err?.message || "");
  const hints = [];

  if (code === "EAUTH" || /Invalid login|Username and Password not accepted|535/i.test(response)) {
    hints.push(
      "Auth rejected. For Gmail/Google Workspace with 2FA, use an App Password — not the normal mailbox password.",
    );
    hints.push(
      "If this is Google Workspace, confirm SMTP is enabled for the org and the mailbox can send as itself.",
    );
  }
  if (code === "ESOCKET" || code === "ETIMEDOUT" || code === "ECONNECTION") {
    hints.push(
      "Network/TLS issue: firewall, blocked outbound 465/587, or wrong host. Try --also-587.",
    );
  }
  if (/Certificate|UNABLE_TO_VERIFY/i.test(response)) {
    hints.push("TLS certificate problem — check EMAIL_HOST spelling / MITM proxy.");
  }
  if (/Daily user sending limit|550|552/i.test(response)) {
    hints.push("Server accepted auth but rejected the message (quota, relay, or recipient policy).");
  }
  if (!hints.length) {
    hints.push("Check host/port/user/pass, then try port 587 with --also-587.");
  }
  return hints;
}

async function main() {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.EMAIL_PORT || "465", 10);
  const user = process.env.EMAIL_USER || "";
  const pass = process.env.EMAIL_PASS || "";
  const from = process.env.EMAIL_FROM || user;
  const fromName = process.env.EMAIL_FROM_NAME || "";
  const to = arg("to") || process.env.EMAIL_TO || user;
  const verifyOnly = hasFlag("verify-only");
  const also587 = hasFlag("also-587");

  if (!user || !pass) {
    console.error("EMAIL_USER and EMAIL_PASS are required.");
    console.error("See header comment in scripts/test-smtp.mjs for usage.");
    process.exit(1);
  }

  if (!verifyOnly && !to) {
    console.error("Set EMAIL_TO or pass --to=you@example.com (or use --verify-only).");
    process.exit(1);
  }

  console.log("SMTP diagnostic starting…");
  console.log(`NODE ${process.version}`);

  const primary = await probe({
    host,
    port,
    user,
    pass,
    from,
    fromName,
    to,
    send: !verifyOnly,
  });

  let secondary = null;
  if (also587 && port !== 587) {
    secondary = await probe({
      host,
      port: 587,
      user,
      pass,
      from,
      fromName,
      to,
      send: !verifyOnly,
    });
  }

  console.log("\n════════════════════════════════════════");
  if (primary.ok && (!secondary || secondary.ok)) {
    console.log("RESULT: OK");
    if (!verifyOnly) {
      console.log(`Check inbox (and spam) for: ${to}`);
    }
    process.exit(0);
  }

  console.log("RESULT: FAILED");
  const err = (!primary.ok && primary.error) || secondary?.error;
  if (err) {
    console.log("Hints:");
    for (const h of hintForError(err)) console.log(`  • ${h}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
