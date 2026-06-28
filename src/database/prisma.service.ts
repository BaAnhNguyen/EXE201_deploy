import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  INestApplication,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    // Use process.env directly since it's loaded before NestJS initialization
    const baseUrl = process.env.DATABASE_URL;

    if (!baseUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    const connectionString =
      baseUrl.includes('connect_timeout')
        ? baseUrl
        : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}connect_timeout=30`;

    const poolMax = Number(process.env.DB_POOL_MAX) || 10;

    const pool = new Pool({
        connectionString,
        max: poolMax,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 30000,
    });

     
    const adapter = new PrismaPg(pool);

    super({
       
      adapter,
      log: ['error', 'warn'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();

    try {
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Database connected');
    } catch (error) {
      this.logger.error('Database connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async withTransaction<T>(
    fn: (tx: TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(fn);
  }

  enableShutdownHooks(app: INestApplication) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (this as any).$on('beforeExit', async () => {
        this.logger.log('Prisma beforeExit → shutting down app');
        await app.close();
    });
  }
}