import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class AuthRepository {
	constructor(private readonly prisma: PrismaService) {}

	findUserByEmail(email: string): Promise<User | null> {
		return this.prisma.user.findUnique({ where: { email } });
	}

	findUserByUsername(username: string): Promise<User | null> {
		return this.prisma.user.findUnique({ where: { username } });
	}

	findUserByEmailOrUsername(email: string, username: string): Promise<User | null> {
		return this.prisma.user.findFirst({
			where: {
				OR: [{ email }, { username }],
			},
		});
	}

	createUser(
		data: Prisma.UserUncheckedCreateInput,
		transactionClient?: Prisma.TransactionClient,
	): Promise<User> {
		const client = transactionClient ?? this.prisma;
		return client.user.create({ data });
	}

	updateLastLogin(userId: number): Promise<User> {
		return this.prisma.user.update({
			where: { id: userId },
			data: { last_login: new Date() },
		});
	}

	updatePassword(userId: number, hashedPassword: string): Promise<User> {
		return this.prisma.user.update({
			where: { id: userId },
			data: { password: hashedPassword },
		});
	}

	findUserById(userId: number): Promise<User | null> {
		return this.prisma.user.findUnique({
			where: { id: userId },
		});
	}
}
