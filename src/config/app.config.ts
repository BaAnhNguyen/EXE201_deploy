import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
	port: Number(process.env.PORT) || 3000,
	nodeEnv: process.env.NODE_ENV ?? 'development',
	url: process.env.APP_URL || 'http://localhost:3000',
}));
