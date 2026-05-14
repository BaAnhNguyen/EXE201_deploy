import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FeatureRepository } from './feature.repository';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';

@Injectable()
export class FeatureService {
  constructor(private readonly featureRepository: FeatureRepository) {}

  async create(createFeatureDto: CreateFeatureDto) {
    try {
      return await this.featureRepository.create(createFeatureDto);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Feature code already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return this.featureRepository.findAll();
  }

  async findOne(id: number) {
    const feature = await this.featureRepository.findById(id);
    if (!feature) {
      throw new NotFoundException(`Feature with ID #${id} not found`);
    }
    return feature;
  }

  async update(id: number, updateFeatureDto: UpdateFeatureDto) {
    await this.findOne(id); // checks if exists
    try {
      return await this.featureRepository.update(id, updateFeatureDto);
    } catch (error: any) {
      if (error.code === 'P2002') { // typically feature_code is unique
        throw new BadRequestException('Feature code already exists');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id); // checks if exists
    return this.featureRepository.delete(id);
  }
}
