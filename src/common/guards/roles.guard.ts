import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // `user.role_id` comes from JwtAuthGuard token payload
    if (!user.role_id) {
      throw new ForbiddenException('User has no role assigned');
    }

    const role = await this.prisma.role.findFirst({
      where: { id: user.role_id, role_code: { in: requiredRoles } },
    });

    if (!role) {
      throw new ForbiddenException('User does not have the required roles');
    }

    return true;
  }
}
