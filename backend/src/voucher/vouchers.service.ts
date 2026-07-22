import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoucherEntity } from '../database/entities/voucher.entity';
import { ValidateVoucherDto } from './dto/validate-voucher.dto';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(VoucherEntity)
    private readonly voucherRepository: Repository<VoucherEntity>,
  ) {}

  async validateVoucher(input: string, total: number, dto: ValidateVoucherDto) {
    // Gutschein suchen (Groß-/Kleinschreibung ignorieren durch .toUpperCase())
    const voucher = await this.voucherRepository.findOne({
      where: { code: dto.code.toUpperCase(), isActive: true },
    });

    if (!voucher) {
      throw new NotFoundException(
        'Dieser Gutscheincode ist ungültig oder nicht aktiv.',
      );
    }

    // 1. Ablaufdatum prüfen
    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      throw new BadRequestException(
        'Dieser Gutscheincode ist leider bereits abgelaufen.',
      );
    }

    // 2. Mindestbestellwert prüfen
    if (
      voucher.minOrderValue &&
      dto.currentCartTotal < Number(voucher.minOrderValue)
    ) {
      throw new BadRequestException(
        `Dieser Gutschein kann erst ab einem Mindestbestellwert von ${Number(voucher.minOrderValue).toFixed(2)}€ angewendet werden.`,
      );
    }

    // 3. Rabatt berechnen
    let discountAmount = 0;
    if (voucher.type === 'PERCENTAGE') {
      discountAmount = (dto.currentCartTotal * Number(voucher.value)) / 100;
    } else {
      discountAmount = Number(voucher.value);
    }

    // Schutz: Rabatt darf nicht höher als der eigentliche Warenwert sein
    if (discountAmount > dto.currentCartTotal) {
      discountAmount = dto.currentCartTotal;
    }

    return {
      valid: true,
      code: voucher.code,
      type: voucher.type,
      discountAmount: Number(discountAmount.toFixed(2)),
      newTotal: Number((dto.currentCartTotal - discountAmount).toFixed(2)),
    };
  }
}
