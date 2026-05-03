import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
	private transporter: nodemailer.Transporter;

	constructor() {
		this.initializeTransporter();
	}

	private initializeTransporter() {
		const smtpConfig = {
			host: process.env.EMAIL_HOST || 'smtp.gmail.com',
			port: parseInt(process.env.EMAIL_PORT || '587'),
			secure: process.env.EMAIL_SECURE === 'true', // false for 587, true for 465
			auth: process.env.EMAIL_USER && process.env.EMAIL_PASS ? {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			} : undefined,
			connectionTimeout: parseInt(process.env.EMAIL_CONNECTION_TIMEOUT || '10000'),
			greetingTimeout: parseInt(process.env.EMAIL_GREETING_TIMEOUT || '10000'),
			socketTimeout: parseInt(process.env.EMAIL_SOCKET_TIMEOUT || '15000'),
		};

		this.transporter = nodemailer.createTransport(smtpConfig);
	}

	private async ensureTransporterReady(): Promise<void> {
		if (!this.transporter) {
			this.initializeTransporter();
		}

		try {
			await this.transporter.verify();
			return;
		} catch (err) {
			console.warn('SMTP verify failed, falling back to Ethereal test account', err?.message ?? err);
		}

		// Fallback to Ethereal test account for development when local SMTP is not available
		try {
			const testAccount = await nodemailer.createTestAccount();
			this.transporter = nodemailer.createTransport({
				host: testAccount.smtp.host,
				port: testAccount.smtp.port,
				secure: testAccount.smtp.secure,
				auth: {
					user: testAccount.user,
					pass: testAccount.pass,
				},
			});
			console.log('Using Ethereal test account for emails. Preview at', 'https://ethereal.email/messages');
		} catch (err) {
			console.error('Failed to create Ethereal test account fallback:', err);
		}
	}

	async sendResetPasswordEmail(email: string, resetToken: string, appUrl: string = 'http://localhost:5000'): Promise<void> {
		const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

		const mailOptions = {
			from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@salesmanagement.com',
			to: email,
			subject: 'Password Reset Request',
			html: this.getResetPasswordEmailTemplate(resetLink),
		};

		try {
			await this.ensureTransporterReady();
			const info = await this.transporter.sendMail(mailOptions);
			// If using Ethereal or test account, log preview URL
			const previewUrl = nodemailer.getTestMessageUrl(info);
			if (previewUrl) {
				console.log('Preview URL for sent email:', previewUrl);
			}
		} catch (error) {
			console.error('Error sending reset password email:', error);
			// Silently fail in development, throw in production
			if (process.env.NODE_ENV === 'production') {
				throw error;
			}
		}
	}

	private getResetPasswordEmailTemplate(resetLink: string): string {
		return `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #333;">Password Reset Request</h2>
				<p>You have requested to reset your password. Click the button below to reset it:</p>
				<div style="margin: 30px 0;">
					<a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
						Reset Password
					</a>
				</div>
				<p>Or copy and paste this link in your browser:</p>
				<p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">${resetLink}</p>
				<p style="color: #666; font-size: 12px;">
					This link will expire in 1 hour.<br>
					If you did not request a password reset, please ignore this email.
				</p>
			</div>
		`;
	}
}
