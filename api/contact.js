import nodemailer from "nodemailer";

// Rate limiting (in-memory, resets per cold start)
const rateLimit = {};
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 3;

function checkRateLimit(ip) {
  const now = Date.now();
  if (!rateLimit[ip]) rateLimit[ip] = [];
  rateLimit[ip] = rateLimit[ip].filter(ts => now - ts < RATE_LIMIT_WINDOW);
  if (rateLimit[ip].length >= RATE_LIMIT_MAX) return false;
  rateLimit[ip].push(now);
  return true;
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, message } = req.body;

  // Validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }
  if (message.length > 5000) {
    return res.status(400).json({ error: "Message too long (max 5000 characters)." });
  }

  // Rate limit
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    // Send email to your inbox
    await transporter.sendMail({
      from: `"Venesia Aquaria Website" <${process.env.SMTP_USER}>`,
      to: process.env.RECIPIENT_EMAIL || "hello@venesiaaquaria.com",
      replyTo: `"${name}" <${email}>`,
      subject: `New inquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1B3C35; border-bottom: 2px solid #EDE9E3; padding-bottom: 12px;">
            New Contact Form Inquiry
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #555; width: 80px;">Name</td>
              <td style="padding: 8px 12px;">${name}</td>
            </tr>
            <tr style="background: #f9f9f6;">
              <td style="padding: 8px 12px; font-weight: bold; color: #555;">Email</td>
              <td style="padding: 8px 12px;"><a href="mailto:${email}">${email}</a></td>
            </tr>
          </table>
          <div style="background: #f9f9f6; padding: 16px; border-radius: 8px; margin-top: 12px;">
            <p style="font-weight: bold; color: #555; margin: 0 0 8px;">Message</p>
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #aaa; font-size: 12px; margin-top: 24px;">
            Sent from venesiaaquaria.com contact form
          </p>
        </div>
      `,
    });

    // Optional auto-reply
    if (process.env.SEND_AUTO_REPLY === "true") {
      await transporter.sendMail({
        from: `"Venesia Aquaria Design" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Thank you for contacting Venesia Aquaria Design",
        text: `Hi ${name},\n\nThank you for reaching out! We've received your message and will get back to you within 1-2 business days.\n\nBest regards,\nVenesia Aquaria Design Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1B3C35;">Thank you, ${name}!</h2>
            <p>We've received your message and will get back to you within 1–2 business days.</p>
            <p style="color: #888; margin-top: 24px;">Best regards,<br/>Venesia Aquaria Design Team</p>
          </div>
        `,
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email send error:", err.message);
    return res.status(500).json({ error: "Failed to send email. Please try again later." });
  }
}