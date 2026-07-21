import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class ValidateVoucherDto {
  @IsString()
  @IsNotEmpty()
  code: string; // e.g : 'DISCOUNT10' or 'WELCOME20'

  @IsNumber()
  @Min(0)
  currentCartTotal: number; // e.g : 100.00 for $100 purchase
}
