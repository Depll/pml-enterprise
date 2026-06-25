import { Controller, Get, Param } from '@nestjs/common';
import { DeliveryAreaService } from './delivery-area.service';

@Controller('api/delivery-areas') // Route auf Englisch geändert
export class DeliveryAreaController {
  constructor(private readonly deliveryAreaService: DeliveryAreaService) {}

  @Get('check/:plz')
  async validatePlz(@Param('plz') plz: string) {
    const isAllowed = await this.deliveryAreaService.checkPlz(plz);
    return { allowed: isAllowed }; // Rückgabe-Key auf Englisch geändert
  }
}
