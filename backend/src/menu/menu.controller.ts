import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import {
  CreateProductDto,
  AddIngredientInputDto,
  UpdateIngredientDto,
} from './dto/menu.dto';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  async getMenu() {
    return this.menuService.getMenu();
  }

  @Post()
  async addProduct(@Body() productData: CreateProductDto) {
    return this.menuService.addProduct(productData);
  }

  @Post(':id/ingredient')
  async addIngredient(
    @Param('id') productId: number,
    @Body() ingredientData: AddIngredientInputDto,
  ) {
    return this.menuService.addIngredient(productId, ingredientData);
  }

  @Patch('ingredient/:id')
  async updateIngredient(
    @Param('id') id: number,
    @Body() ingredientData: UpdateIngredientDto,
  ) {
    return this.menuService.updateIngredient(Number(id), ingredientData);
  }

  @Patch(':id')
  async updateProduct(
    @Param('id') id: number,
    @Body() productData: Partial<CreateProductDto>,
  ) {
    return this.menuService.updateProduct(id, productData);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: number) {
    return this.menuService.deleteProduct(id);
  }

  @Delete('ingredient/:id')
  async deleteIngredient(@Param('id') id: string) {
    // Wandelt den URL-String wieder in eine Zahl um, da Zutat-IDs Nummern sind
    return this.menuService.deleteIngredient(Number(id));
  }
}
