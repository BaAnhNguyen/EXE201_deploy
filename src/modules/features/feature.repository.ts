import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Feature } from '@prisma/client';

@Injectable()
export class FeatureRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.FeatureCreateInput): Promise<Feature> {
    return this.prisma.feature.create({ data });
  }

  async findAll(): Promise<Feature[]> {
    return this.prisma.feature.findMany();
  }

  async findById(id: number): Promise<Feature | null> {
    return this.prisma.feature.findUnique({
      where: { id },
    });
  }

  async findByCode(feature_code: string): Promise<Feature | null> {
    return this.prisma.feature.findUnique({
      where: { feature_code },
    });
  }

  async update(id: number, data: Prisma.FeatureUpdateInput): Promise<Feature> {
    return this.prisma.feature.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Feature> {
    return this.prisma.feature.delete({
      where: { id },
    });
  }
}
