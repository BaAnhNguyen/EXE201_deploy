import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { CommonModule } from 'src/common/common.module';
import { DatabaseModule } from 'src/database/database.module';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

@Module({
	imports: [
		DatabaseModule,
		CommonModule,
		ConfigModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				secret: configService.get<string>('jwt.secret'),
				signOptions: {
					expiresIn: configService.get<string>('jwt.expiresIn') as StringValue,
				},
			}),
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, AuthRepository],
	exports: [AuthService, JwtModule],
})
export class AuthModule {}
