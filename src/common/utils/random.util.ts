import { Injectable } from '@nestjs/common';
import { randomInt as cryptoRandomInt, randomBytes } from 'crypto';

@Injectable()
export class RandomUtil {
    randomInt(min: number, max: number): number {
        return cryptoRandomInt(min, max + 1); 
    }

    randomFloat(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    randomString(length: number): string {
        return randomBytes(length)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, length);
    }

    randomOtp(): string {
        return cryptoRandomInt(100000, 1000000).toString();
    }

    randomBoolean(): boolean {
        return cryptoRandomInt(0, 2) === 1;
    }
}