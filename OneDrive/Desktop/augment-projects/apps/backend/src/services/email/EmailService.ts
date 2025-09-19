import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.log('Email would be sent:', { to, subject });
        return;
      }

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@crucibai.com',
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      });

      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    const subject = 'Welcome to CrucibleAI!';
    const html = `
      <h1>Welcome to CrucibleAI, ${userName}!</h1>
      <p>Thank you for joining our AI development platform.</p>
      <p>You now have access to:</p>
      <ul>
        <li>Advanced AI model orchestration</li>
        <li>Quantum computing capabilities</li>
        <li>AR/VR development tools</li>
        <li>Multi-cloud deployment</li>
      </ul>
      <p>Get started by exploring our dashboard!</p>
      <p>Best regards,<br>The CrucibleAI Team</p>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<void> {
    const subject = 'Reset Your CrucibleAI Password';
    const resetUrl = `${process.env.FRONTEND_ORIGIN}/reset-password?token=${resetToken}`;
    
    const html = `
      <h1>Password Reset Request</h1>
      <p>You requested to reset your password for your CrucibleAI account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The CrucibleAI Team</p>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  async sendSubscriptionConfirmation(
    userEmail: string,
    userName: string,
    planName: string,
    amount: number
  ): Promise<void> {
    const subject = 'Subscription Confirmed - CrucibleAI';
    const html = `
      <h1>Subscription Confirmed!</h1>
      <p>Hi ${userName},</p>
      <p>Your subscription to CrucibleAI ${planName} has been confirmed.</p>
      <p><strong>Plan:</strong> ${planName}</p>
      <p><strong>Amount:</strong> $${amount}/month</p>
      <p>You now have access to all premium features!</p>
      <p>Best regards,<br>The CrucibleAI Team</p>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  async sendDataBreachNotification(
    userEmail: string,
    userName: string,
    breachDetails: string
  ): Promise<void> {
    const subject = 'Important Security Notice - CrucibleAI';
    const html = `
      <h1>Security Notice</h1>
      <p>Hi ${userName},</p>
      <p>We are writing to inform you of a security incident that may have affected your account.</p>
      <p><strong>What happened:</strong> ${breachDetails}</p>
      <p><strong>What we're doing:</strong> We have taken immediate action to secure our systems and are working with security experts to investigate this incident.</p>
      <p><strong>What you should do:</strong> As a precaution, we recommend changing your password immediately.</p>
      <p>We sincerely apologize for any inconvenience this may cause.</p>
      <p>Best regards,<br>The CrucibleAI Security Team</p>
    `;

    await this.sendEmail(userEmail, subject, html);
  }
}

export const emailService = new EmailService();
