import { Controller, Get } from '@nestjs/common';
import { CollectorService } from './collector.service';

@Controller()
export class CollectorController {
  constructor(private readonly collectorService: CollectorService) {}

  @Get()
  getHello(): string {
    return this.collectorService.getHello();
  }
}
