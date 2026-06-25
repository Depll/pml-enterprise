import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Length,
} from 'class-validator';

// DTO für das Erstellen eines Produkts
export class CreateProductDto {
  @IsString({ message: 'Die SKU muss ein Text sein.' })
  @Length(1, 50, { message: 'Die SKU muss ausgefüllt sein.' })
  sku: string;

  @IsString({ message: 'Der Name muss ein Text sein.' })
  @Length(2, 150, {
    message: 'Der Name muss zwischen 2 und 150 Zeichen lang sein.',
  })
  name: string;

  @IsOptional()
  @IsString({ message: 'Die Beschreibung muss ein Text sein.' })
  description?: string;

  @IsNumber({}, { message: 'Der Preis muss eine Zahl sein.' })
  @Min(0, { message: 'Der Preis darf nicht negativ sein.' })
  price: number;

  @IsNumber({}, { message: 'Die Kategorie-ID muss eine Zahl sein.' })
  categoryId: number;

  @IsOptional()
  @IsBoolean({ message: 'Aktiv muss ein Boolean sein.' })
  isActive?: boolean;
}

// DTO für das Hinzufügen einer Zutat zu einem Produkt
export class AddIngredientInputDto {
  @IsString({ message: 'Der Name der Zutat muss ein Text sein.' })
  @Length(2, 50, {
    message: 'Der Name muss zwischen 2 und 50 Zeichen lang sein.',
  })
  name: string;

  @IsNumber({}, { message: 'Der Preis muss eine Zahl sein.' })
  @Min(0, { message: 'Der Preis darf nicht negativ sein.' })
  price: number;
}

// DTO für das Bearbeiten einer bestehenden Zutat
export class UpdateIngredientDto {
  @IsOptional()
  @IsString({ message: 'Der Name muss ein Text sein.' })
  @Length(2, 50, {
    message: 'Der Name muss zwischen 2 und 50 Zeichen lang sein.',
  })
  name?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Der Aufpreis muss eine Zahl sein.' })
  @Min(0, { message: 'Der Aufpreis darf nicht negativ sein.' })
  extraPrice?: number;
}
