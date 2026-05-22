import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
	url: process.env.DATABASE_URL,
	pool_max: Number(process.env.DB_POOL_MAX) || 10,
}));
