import nodemailer from 'nodemailer';
import prisma from '../prisma';

export const getEmailConfig = async () => {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: {
                    in: [
                        'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM',
                        'TEMPLATE_WELCOME_SUBJECT', 'TEMPLATE_WELCOME_BODY',
                        'TEMPLATE_RESET_PASSWORD_SUBJECT', 'TEMPLATE_RESET_PASSWORD_BODY',
                        'TEMPLATE_RESET_SUCCESS_SUBJECT', 'TEMPLATE_RESET_SUCCESS_BODY',
                        'TEMPLATE_MONTHLY_REPORT_SUBJECT', 'TEMPLATE_MONTHLY_REPORT_BODY'
                    ]
                }
            }
        });

        const config: Record<string, string> = {};
        settings.forEach(s => {
            config[(s as any).key] = (s as any).value;
        });

        return config;
    } catch (error) {
        console.error('Error fetching email config:', error);
        return {};
    }
};

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const config = await getEmailConfig();

        const isPlaceholder = config.SMTP_USER === 'PLACEHOLDER_USER' || config.SMTP_PASS === 'PLACEHOLDER_PASS';

        if (!config.SMTP_HOST || (!config.SMTP_USER && !config.SMTP_PASS) || isPlaceholder) {
            console.warn(`[Email Service] SMTP settings not fully configured or using placeholders. Email skipped.`);
            console.log('--- MOCK EMAIL ---');
            console.log('To:', to);
            console.log('Subject:', subject);
            console.log('Content (first 100 chars):', html.substring(0, 100) + '...');
            console.log('------------------');
            console.log(`[TIP] Update SMTP settings in the Admin Panel to send real emails.`);
            return;
        }

        const transporter = nodemailer.createTransport({
            host: config.SMTP_HOST,
            port: parseInt(config.SMTP_PORT || '587'),
            secure: config.SMTP_PORT === '465',
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: config.SMTP_FROM || config.SMTP_USER,
            to,
            subject,
            html,
        });

        return info;
    } catch (error) {
        console.error('Failed to send email:', error);
    }
};

const DEFAULT_WELCOME_SUBJECT = 'Welcome to Cycling App!';
const DEFAULT_WELCOME_BODY = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #4f46e5;">Welcome, {{firstName}}!</h1>
        <p>We're thrilled to have you join our cyclist community!</p>
        <p>Start tracking your activities, joining clubs, and competing in challenges to earn awards.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            Happy cycling!<br>
            The Cycling App Team
        </div>
    </div>
`;

const DEFAULT_RESET_SUBJECT = 'Reset Your Password';
const DEFAULT_RESET_BODY = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #4f46e5;">Password Reset</h1>
        <p>You (or someone else) requested a password reset for your account.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Otherwise, click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetLink}}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">{{resetLink}}</p>
    </div>
`;

const DEFAULT_RESET_SUCCESS_SUBJECT = 'Password Changed Successfully';
const DEFAULT_RESET_SUCCESS_BODY = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #10b981;">Password Updated</h1>
        <p>Hello {{firstName}},</p>
        <p>Your password has been successfully changed. If you did not make this change, please contact support immediately.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            Stay secure!<br>
            The Cycling App Team
        </div>
    </div>
`;

const DEFAULT_MONTHLY_REPORT_SUBJECT = 'Your Monthly Cycling Summary - {{month}}';
const DEFAULT_MONTHLY_REPORT_BODY = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #4f46e5;">Monthly Report: {{month}}</h1>
        <p>Great work this month, {{firstName}}!</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Total Rides:</strong> {{totalRides}}</p>
            <p style="margin: 5px 0;"><strong>Total Distance:</strong> {{totalDistance}} km</p>
            <p style="margin: 5px 0;"><strong>Elevation Gain:</strong> {{elevationGain}} m</p>
        </div>
        <p>Keep pedaling toward your goals!</p>
    </div>
`;

export const sendWelcomeEmail = async (to: string, firstName: string) => {
    const config = await getEmailConfig();
    let subject = config.TEMPLATE_WELCOME_SUBJECT || DEFAULT_WELCOME_SUBJECT;
    let html = config.TEMPLATE_WELCOME_BODY || DEFAULT_WELCOME_BODY;

    // Replace placeholders
    html = html.replace(/{{firstName}}/g, firstName);
    subject = subject.replace(/{{firstName}}/g, firstName);

    return sendEmail(to, subject, html);
};

export const sendResetPasswordEmail = async (to: string, resetLink: string) => {
    const config = await getEmailConfig();
    let subject = config.TEMPLATE_RESET_PASSWORD_SUBJECT || DEFAULT_RESET_SUBJECT;
    let html = config.TEMPLATE_RESET_PASSWORD_BODY || DEFAULT_RESET_BODY;

    // Replace placeholders
    html = html.replace(/{{resetLink}}/g, resetLink);
    subject = subject.replace(/{{resetLink}}/g, resetLink);

    return sendEmail(to, subject, html);
};

export const sendResetSuccessEmail = async (to: string, firstName: string) => {
    const config = await getEmailConfig();
    let subject = config.TEMPLATE_RESET_SUCCESS_SUBJECT || DEFAULT_RESET_SUCCESS_SUBJECT;
    let html = config.TEMPLATE_RESET_SUCCESS_BODY || DEFAULT_RESET_SUCCESS_BODY;

    html = html.replace(/{{firstName}}/g, firstName);
    subject = subject.replace(/{{firstName}}/g, firstName);

    return sendEmail(to, subject, html);
};

export const sendMonthlyReportEmail = async (to: string, data: { firstName: string, month: string, totalRides: string, totalDistance: string, elevationGain: string }) => {
    const config = await getEmailConfig();
    let subject = config.TEMPLATE_MONTHLY_REPORT_SUBJECT || DEFAULT_MONTHLY_REPORT_SUBJECT;
    let html = config.TEMPLATE_MONTHLY_REPORT_BODY || DEFAULT_MONTHLY_REPORT_BODY;

    // Replace placeholders
    html = html.replace(/{{firstName}}/g, data.firstName);
    html = html.replace(/{{month}}/g, data.month);
    html = html.replace(/{{totalRides}}/g, data.totalRides);
    html = html.replace(/{{totalDistance}}/g, data.totalDistance);
    html = html.replace(/{{elevationGain}}/g, data.elevationGain);

    subject = subject.replace(/{{firstName}}/g, data.firstName);
    subject = subject.replace(/{{month}}/g, data.month);

    return sendEmail(to, subject, html);
};
