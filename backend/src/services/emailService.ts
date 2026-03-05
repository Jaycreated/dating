import { Resend } from 'resend';

export class EmailService {
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY not found in environment. Email service will be disabled.');
      this.resend = null as any;
      return;
    }
    this.resend = new Resend(apiKey);
  }

  async sendPasswordResetEmail(email: string, resetUrl: string) {
    if (!this.resend) {
      console.log('Email service disabled. Reset URL:', resetUrl);
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'support@pairfect.com.ng',
        to: [email],
        subject: 'Reset your Pairfect password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #651B55; margin: 0;">Pairfect</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Reset Your Password</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Hello,</h2>
              <p style="color: #666; line-height: 1.6;">
                We received a request to reset your password for your Pairfect account. 
                Click the button below to reset your password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: #651B55; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;
                          font-weight: bold;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #651B55; word-break: break-all;">
                  ${resetUrl}
                </a>
              </p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; 
                        border-radius: 5px; margin-bottom: 20px;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>Important:</strong> This link will expire in 1 hour for security reasons. 
                If you didn't request this password reset, please ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
              <p>© 2026 Pairfect. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.log('Password reset email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string) {
    if (!this.resend) {
      console.log('Email service disabled. Welcome email would be sent to:', email);
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'support@pairfect.com.ng',
        to: [email],
        subject: 'Welcome to Pairfect!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #651B55; margin: 0;">Pairfect</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Find Your Perfect Match</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Welcome to Pairfect, ${name}!</h2>
              <p style="color: #666; line-height: 1.6;">
                We're excited to have you join our community! Pairfect is where real people connect 
                and find meaningful relationships.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                   style="background: #651B55; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;
                          font-weight: bold;">
                  Get Started
                </a>
              </div>
              
              <p style="color: #666; line-height: 1.6;">
                Complete your profile to get better matches and start your journey to finding love!
              </p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
              <p>© 2026 Pairfect. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        throw new Error(`Failed to send welcome email: ${error.message}`);
      }

      console.log('Welcome email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
