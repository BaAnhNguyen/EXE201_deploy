import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  private get apiKey(): string {
    return (
      this.configService.get<string>('BREVO_API_KEY') ||
      process.env.BREVO_API_KEY ||
      ''
    );
  }

  private get fromEmail(): string {
    return (
      this.configService.get<string>('EMAIL_FROM') ||
      process.env.EMAIL_FROM ||
      'noreply@example.com'
    );
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
     console.log('BREVO_API_KEY length:', this.apiKey?.length);
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { email: this.fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      },
    );
  }

  async sendResetPasswordEmail(
    email: string,
    resetToken: string,
    appUrl?: string,
  ): Promise<void> {
    const baseUrl =
      appUrl ||
      this.configService.get<string>('APP_URL') ||
      process.env.APP_URL ||
      'http://localhost:5000';

    const resetPath =
      this.configService.get<string>('RESET_PASSWORD_PATH') ||
      process.env.RESET_PASSWORD_PATH ||
      '/reset-password';

    const resetLink = `${baseUrl}${resetPath}?token=${resetToken}`;

    try {
      await this.sendEmail(
        email,
        'Password Reset Request',
        this.getResetPasswordEmailTemplate(resetLink),
      );
    } catch (error) {
      console.error('Error sending reset password email:', error?.response?.data || error.message);
      throw error;
    }
  }

  async sendNewAccountEmail(
    email: string,
    username: string,
    password: string,
    appUrl?: string,
  ): Promise<void> {
    const baseUrl =
      appUrl ||
      this.configService.get<string>('APP_URL') ||
      process.env.APP_URL ||
      'http://localhost:5000';

    const loginLink = `${baseUrl}/login`;

    try {
      await this.sendEmail(
        email,
        'Tài khoản nhân viên mới',
        this.getNewAccountEmailTemplate(username, password, loginLink),
      );
    } catch (error) {
      console.error('Error sending new account email:', error?.response?.data || error.message);
      throw error;
    }
  }

  private getResetPasswordEmailTemplate(resetLink: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Click below to reset password:</p>
        <a href="${resetLink}" style="background:#4CAF50;color:white;padding:10px 20px;text-decoration:none;">
          Reset Password
        </a>
        <p>${resetLink}</p>
      </div>
    `;
  }

  private getNewAccountEmailTemplate(
    username: string,
    password: string,
    loginLink: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Tài khoản mới</h2>
        <p>Username: <b>${username}</b></p>
        <p>Password: <b>${password}</b></p>
        <p>Login: <a href="${loginLink}">${loginLink}</a></p>
      </div>
    `;
  }
}
