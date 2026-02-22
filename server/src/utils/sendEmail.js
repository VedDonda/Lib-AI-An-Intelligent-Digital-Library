import nodemailer from "nodemailer";

/**
 * Send an email using the configured SMTP transporter.
 * Transporter is created lazily so that env vars are available (dotenv loaded first).
 * @param {{ to: string, subject: string, html: string }} options
 */
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
    await getTransporter().sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
    });
};
