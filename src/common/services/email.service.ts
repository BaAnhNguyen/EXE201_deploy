import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
	private transporter!: nodemailer.Transporter;

	constructor(private readonly configService: ConfigService) {
		this.initializeTransporter();
	}

	private initializeTransporter() {
		const host = this.configService.get<string>('EMAIL_HOST') || process.env.EMAIL_HOST || 'smtp.gmail.com';
		const portStr = this.configService.get<string>('EMAIL_PORT') || process.env.EMAIL_PORT || '587';
		const secureStr = this.configService.get<string>('EMAIL_SECURE') || process.env.EMAIL_SECURE;
		const user = this.configService.get<string>('EMAIL_USER') || process.env.EMAIL_USER;
		const pass = this.configService.get<string>('EMAIL_PASS') || process.env.EMAIL_PASS;
		
		const smtpConfig = {
			host,
			port: parseInt(portStr),
			secure: secureStr === 'true', // false for 587, true for 465
			auth: user && pass ? {
				user,
				pass,
			} : undefined,
			connectionTimeout: 10000,
			greetingTimeout: 10000,
			socketTimeout: 15000,
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
		} catch (err: any) {
			console.error('SMTP verify failed:', err?.message ?? err);
			throw err;
		}
	}

	async sendResetPasswordEmail(email: string, resetToken: string, appUrl: string = 'http://localhost:5000'): Promise<void> {
		const resetPath = this.configService.get<string>('RESET_PASSWORD_PATH') || process.env.RESET_PASSWORD_PATH || '/reset-password';
		const resetLink = `${appUrl}${resetPath}?token=${resetToken}`;

		const from = this.configService.get<string>('EMAIL_FROM') || process.env.EMAIL_FROM || this.configService.get<string>('EMAIL_USER') || process.env.EMAIL_USER || 'noreply@salesmanagement.com';
		const mailOptions = {
			from,
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
			throw error;
		}
	}

	async sendNewAccountEmail(
		email: string,
		username: string,
		password: string,
		appUrl: string = 'http://localhost:5000',
	): Promise<void> {
		const from = this.configService.get<string>('EMAIL_FROM') || process.env.EMAIL_FROM || this.configService.get<string>('EMAIL_USER') || process.env.EMAIL_USER || 'noreply@salesmanagement.com';
		const loginLink = `${appUrl}/login`;

		const mailOptions = {
			from,
			to: email,
			subject: 'Tài khoản nhân viên mới',
			html: this.getNewAccountEmailTemplate(username, password, loginLink),
		};

		try {
			await this.ensureTransporterReady();
			const info = await this.transporter.sendMail(mailOptions);
			const previewUrl = nodemailer.getTestMessageUrl(info);
			if (previewUrl) {
				console.log('Preview URL for sent email:', previewUrl);
			}
		} catch (error) {
			console.error('Error sending new account email:', error);
			throw error;
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
					This link will expire in 15 minutes.<br>
					If you did not request a password reset, please ignore this email.
				</p>
			</div>
		`;
	}

	private getNewAccountEmailTemplate(username: string, password: string, loginLink: string): string {
		return `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #333;">Tài khoản nhân viên mới</h2>
				<p>Bạn đã được tạo tài khoản để đăng nhập vào hệ thống.</p>
				<div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 24px 0;">
					<p style="margin: 0 0 8px;">Username: <strong>${username}</strong></p>
					<p style="margin: 0 0 8px;">Password: <strong>${password}</strong></p>
					<p style="margin: 0;">Link đăng nhập: <a href="${loginLink}">${loginLink}</a></p>
				</div>
				<p style="color: #666; font-size: 12px;">
					Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu.
				</p>
			</div>
		`;
	}
}
