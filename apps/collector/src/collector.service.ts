import { Injectable } from '@nestjs/common';

@Injectable()
export class CollectorService {
  getHello(): string {
    return 'Hello World!';
  }
}
