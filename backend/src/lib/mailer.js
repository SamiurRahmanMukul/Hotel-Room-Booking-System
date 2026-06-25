/**
 * Mailer abstraction.
 *
 * Transports controlled by MAIL_TRANSPORT env:
 *   'console' (default in dev) — logs the email to stdout, never sends
 *   'sendgrid' — uses @sendgrid/mail (already in deps), needs SENDGRID_API_KEY
 *   'resend'   — uses fetch to https://api.resend.com, needs RESEND_API_KEY
 *
 * Public API:
 *   sendMail({ to, subject, html, text }) → { transport, id }
 *
 * Failures throw. Callers that want fire-and-forget should wrap in try/catch.
 */

const logger = require('../middleware/winston.logger');

const FROM = process.env.MAIL_FROM || 'platform@booking.local';
const TRANSPORT = (process.env.MAIL_TRANSPORT || 'console').toLowerCase();

async function sendViaConsole({ to, subject, html, text }) {
  // eslint-disable-next-line no-console
  console.log(`
╔════════════════════════════════════════════════════════════════
║ 📧 [console mailer]  ${new Date().toISOString()}
║ From: ${FROM}
║ To:   ${to}
║ Subj: ${subject}
╠════════════════════════════════════════════════════════════════
${(text || html || '').split('\n').map((l) => `║ ${l}`).join('\n')}
╚════════════════════════════════════════════════════════════════
`);
  return { transport: 'console', id: `console-${Date.now()}` };
}

async function sendViaSendgrid({ to, subject, html, text }) {
  // eslint-disable-next-line global-require
  const sg = require('@sendgrid/mail');
  sg.setApiKey(process.env.SENDGRID_API_KEY || process.env.SEND_GRID_API_KEY);
  const [resp] = await sg.send({
    to, from: FROM, subject, html, text: text || html
  });
  return { transport: 'sendgrid', id: resp.headers['x-message-id'] };
}

async function sendViaResend({ to, subject, html, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: FROM, to, subject, html, text })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`resend failed ${res.status}: ${body}`);
  }
  const data = await res.json();
  return { transport: 'resend', id: data.id };
}

const TRANSPORTS = {
  console: sendViaConsole,
  sendgrid: sendViaSendgrid,
  resend: sendViaResend
};

async function sendMail({ to, subject, html, text }) {
  if (!to) throw new Error('sendMail: to required');
  const fn = TRANSPORTS[TRANSPORT];
  if (!fn) throw new Error(`unknown MAIL_TRANSPORT: ${TRANSPORT}`);
  try {
    const result = await fn({ to, subject, html, text });
    logger.info(`mail sent via ${result.transport} to ${to} [${result.id}]`);
    return result;
  } catch (err) {
    logger.error(`mail send failed: ${err.message}`);
    throw err;
  }
}

module.exports = { sendMail, TRANSPORT, FROM };
