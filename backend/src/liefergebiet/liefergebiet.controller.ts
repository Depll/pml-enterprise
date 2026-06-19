import { Controller, Get, Param } from '@nestjs/common';
import { LiefergebietService } from './liefergebiet.service';

@Controller('api/liefergebiet')
export class LiefergebietController {
  constructor(private readonly liefergebietService: LiefergebietService) {}

  @Get('check/:plz')
  async validatePlz(@Param('plz') plz: string) {
    const erlaubt = await this.liefergebietService.checkPlz(plz);
    return { erlaubt };
  }
}
