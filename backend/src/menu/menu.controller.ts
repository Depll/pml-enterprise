import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { MenuService, CreateProductDto, UpdateZutatDto } from './menu.service';
import { IsString, IsNumber, Min, Length } from 'class-validator';

export class AddZutatInput {
  @IsString({ message: 'Der Name der Zutat muss ein Text sein.' })
  @Length(2, 50, {
    message: 'Der Name muss zwischen 2 und 50 Zeichen lang sein.',
  })
  name: string;

  @IsNumber({}, { message: 'Der Preis muss eine Zahl sein.' })
  @Min(0, { message: 'Der Preis darf nicht negativ sein.' })
  preis: number;
}

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  async getMenu() {
    return this.menuService.getSpeisekarte();
  }

  @Post()
  async addProduct(@Body() productData: CreateProductDto) {
    return this.menuService.addGericht(productData);
  }

  @Post(':id/zutat')
  async addZutat(
    @Param('id') produktId: number,
    @Body() zutatData: AddZutatInput,
  ) {
    return this.menuService.addZutat(Number(produktId), zutatData);
  }

  @Patch('zutat/:id')
  async updateZutat(
    @Param('id') id: number,
    @Body() zutatData: UpdateZutatDto,
  ) {
    return this.menuService.updateZutat(Number(id), zutatData);
  }

  @Patch(':id')
  async updateProduct(
    @Param('id') id: number,
    @Body() productData: Partial<CreateProductDto>,
  ) {
    return this.menuService.updateGericht(Number(id), productData);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: number) {
    return this.menuService.deleteGericht(Number(id));
  }

  @Delete('zutat/:id')
  async deleteZutat(@Param('id') id: number) {
    return this.menuService.deleteZutat(Number(id));
  }
}
