import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateNested,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO für eine einzelne Position im Warenkorb
export class OrderPositionDto {
  // GEÄNDERT: Von @IsString auf @IsNumber geändert, da deine Entity ein 'int' verlangt!
  @IsNumber({}, { message: 'Die Produkt-ID muss eine Zahl sein.' })
  @IsNotEmpty({ message: 'Die Produkt-ID darf nicht leer sein.' })
  productId: number;

  @IsNumber({}, { message: 'Die Menge muss eine Zahl sein.' })
  @Min(1, { message: 'Die Menge muss mindestens 1 sein.' })
  quantity: number;

  // NEU HINZUGEFÜGT: Weil deine Entity 'price_snapshot' verlangt!
  @IsNumber({}, { message: 'Der Preis-Snapshot muss eine Zahl sein.' })
  priceSnapshot: number;

  @IsOptional()
  @IsString({ message: 'Die ausgewählte Größe (z.B. XXL) muss ein Text sein.' })
  selectedSize?: string;

  @IsOptional()
  @IsString({ message: 'Die gewählte Option muss ein Text sein.' })
  selectedOption?: string;

  @IsOptional()
  @IsString({ message: 'Die Anmerkung muss ein Text sein.' })
  comment?: string;

  @IsArray({
    message: 'Ausgewählte Zutaten müssen als Array übergeben werden.',
  })
  @IsOptional()
  selectedIngredientsIds?: number[];

  @IsArray({ message: 'Entfernte Zutaten müssen als Array übergeben werden.' })
  @IsOptional()
  removedIngredientsIds?: number[];
}

// Haupt-DTO für das Erstellen einer Bestellung
export class CreateOrderDto {
  @IsString({ message: 'Der Name muss ein Text sein.' })
  @Length(2, 150, {
    message: 'Der Name muss zwischen 2 und 150 Zeichen lang sein.',
  })
  customerName: string;

  @IsString({ message: 'Die Straße muss ein Text sein.' })
  @IsNotEmpty({ message: 'Die Straße darf nicht leer sein.' })
  street: string;

  @IsString({ message: 'Die Hausnummer muss ein Text sein.' })
  @IsNotEmpty({ message: 'Die Hausnummer darf nicht leer sein.' })
  houseNumber: string;

  @IsString({ message: 'Die PLZ muss ein Text sein.' })
  @Length(5, 5, { message: 'Die PLZ muss genau 5 Zeichen lang sein.' })
  postcode: string;

  @IsOptional()
  @IsString({ message: 'Die Stadt muss ein Text sein.' })
  city?: string;

  @IsString({ message: 'Die Telefonnummer muss ein Text sein.' })
  @IsNotEmpty({ message: 'Die Telefonnummer darf nicht leer sein.' })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Bitte gib eine gültige E-Mail-Adresse ein.' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Die Lieferanmerkung muss ein Text sein.' })
  deliveryNote?: string;

  @IsNumber({}, { message: 'Der Gesamtpreis muss eine Zahl sein.' })
  @Min(0, { message: 'Der Gesamtpreis kann nicht negativ sein.' })
  totalPrice: number; // <-- Das hier einfach unten drunter hinzufügen!

  @IsArray({ message: 'Die Bestellung muss Positionen enthalten.' })
  @ValidateNested({ each: true })
  @Type(() => OrderPositionDto)
  positions: OrderPositionDto[];
}

// DTO für das Ändern des Bestellstatus
export class UpdateOrderStatusDto {
  @IsString({ message: 'Der Status muss ein Text sein.' })
  @IsNotEmpty({ message: 'Der Status darf nicht leer sein.' })
  status: string;

  @IsOptional()
  @IsString({ message: 'Der Stornogrund muss ein Text sein.' })
  stornoReason?: string; // von 'stornoGrund' zu 'stornoReason'
}
