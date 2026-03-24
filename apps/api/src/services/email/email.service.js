import env from '../../config/env.js';

let transporterPromise = null;

async function createSmtpTransport() {
  const { default: nodemailer } = await import('nodemailer');

  return nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
    auth: env.mail.user
      ? {
          user: env.mail.user,
          pass: env.mail.pass,
        }
      : undefined,
  });
}

async function getTransporter() {
  if (env.mail.transport === 'mock') {
    return {
      async sendMail(payload) {
        return {
          envelope: { to: payload.to },
          messageId: `mock-${Date.now()}`,
        };
      },
    };
  }

  if (!transporterPromise) {
    transporterPromise = createSmtpTransport();
  }

  return transporterPromise;
}

export async function sendEmail({ to, subject, text, html }) {
  const transporter = await getTransporter();
  const result = await transporter.sendMail({
    from: env.mail.from,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });

  return {
    delivery: env.mail.transport,
    messageId: result.messageId || null,
  };
}
