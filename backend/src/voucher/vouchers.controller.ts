import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { ValidateVoucherDto } from './dto/validate-voucher.dto';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK) // POST liefert standardmäßig 201, wir wollen hier aber 200 OK
  async validate(@Body() dto: ValidateVoucherDto) {
    return this.vouchersService.validateVoucher(dto);
  }
}
