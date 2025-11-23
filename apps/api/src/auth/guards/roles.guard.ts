/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// apps/api/src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Étape 1 : Récupère les rôles requis
    const requiredRoles: string[] = this.reflector.getAllAndOverride(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Étape 2 : Si pas de rôles requis, autoriser
    if (!requiredRoles) {
      return true;
    }

    // Étape 3 : Récupère l'utilisateur
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Étape 4 : Vérifie si le rôle de l'user est dans les rôles requis
    return requiredRoles.some((role) => role === user.role);
  }
}
