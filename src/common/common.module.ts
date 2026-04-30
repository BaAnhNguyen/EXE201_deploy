import { Module } from '@nestjs/common';
import { RandomUtil } from './utils/random.util';

@Module({
  providers: [RandomUtil],
  exports: [RandomUtil],
})
export class CommonModule {}