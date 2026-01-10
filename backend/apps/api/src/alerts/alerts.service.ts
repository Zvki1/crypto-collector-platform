/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { PrismaService } from 'backend/libs/database/src';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAlertDto } from './dto/createAlert.dto';
import { AlertStatus } from '@prisma/client';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}
  async CreateAlert(userId: string, createAlertDto: CreateAlertDto) {
    const activeAlertsCount = await this.prisma.alert.count({
      where: {
        userId,
        status: AlertStatus.ACTIVE,
      },
    });
    if (activeAlertsCount >= 10) {
      throw new BadRequestException(
        'Limite de 10 alertes actives atteinte. Supprimez ou désactivez une alerte existante.',
      );
    }
    const alert = await this.prisma.alert.create({
      data: {
        userId,
        cryptocurrencyId: createAlertDto.cryptocurrencyId,
        type: createAlertDto.type,
        targetPrice: createAlertDto.targetPrice,
      },
      include: {
        cryptocurrency: true,
      },
    });
    return alert;
  }
  async getAlerts(userId: string) {
    const alerts = await this.prisma.alert.findMany({
      where: { userId },
      include: { cryptocurrency: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!alerts) {
      throw new NotFoundException('alerts introuvable');
    }
    return alerts;
  }
  async deleteAlert(id: string, userId: string) {
    try {
      const deletedAlert = await this.prisma.alert.delete({
        where: { id, userId },
      });
      return deletedAlert;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Alerte introuvable');
      }
      throw error;
    }
  }
}
