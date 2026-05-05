import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminOnlyGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const user = request.user;

		if (!user) {
			throw new UnauthorizedException('User not authenticated');
		}

		if (user.type !== 'ADMIN') {
			throw new UnauthorizedException('Only admins can access this resource');
		}

		return true;
	}
}
