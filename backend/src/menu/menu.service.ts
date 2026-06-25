import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../database/entities/category.entity';
import { ProductEntity } from '../database/entities/product.entity';
import { IngredientEntity } from '../database/entities/ingredient.entity';
import {
  CreateProductDto,
  UpdateIngredientDto,
  AddIngredientInputDto,
} from './dto/menu.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MenuService {
  // Initializing the system logger and definition for the storage stream
  private readonly sysLogger = new Logger(MenuService.name);
  private readonly logFilePath = path.join(process.cwd(), 'logging.txt');

  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,

    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(IngredientEntity)
    private readonly ingredientRepository: Repository<IngredientEntity>,
  ) {}

  async getMenu() {
    return await this.categoryRepository.find({
      relations: {
        products: {
          ingredients: true,
        },
      },
      order: {
        id: 'ASC',
      },
    });
  }

  /**
   * Persists a new product record inside the database layer and appends the transmission payload to logging.txt.
   */
  async addProduct(productData: CreateProductDto) {
    // 1. Generate timestamp and append raw client payload asynchronously to the local log file
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] POST /menu - Payload Received: ${JSON.stringify(productData)}\n`;

    fs.appendFile(this.logFilePath, logEntry, 'utf8', (err) => {
      if (err) {
        this.sysLogger.error(
          'Failed appending transmission metadata stream to logging.txt',
          err.stack,
        );
      } else {
        this.sysLogger.log(
          'Successfully written payload metadata intercept to tracking file.',
        );
      }
    });

    // 2. Original execution workflow for database mapping
    const { categoryId, description, price, isActive, ...restlicheDaten } =
      productData;

    const newProduct = this.productRepository.create({
      ...restlicheDaten,
      description,
      price,
      isActive: isActive ?? true,
      category: { id: Number(categoryId) } as CategoryEntity,
    });

    return await this.productRepository.save(newProduct);
  }

  async updateProduct(id: number, productData: Partial<CreateProductDto>) {
    const product = await this.productRepository.findOne({
      where: { id: Number(id) },
    });
    if (!product) {
      throw new NotFoundException(`Gericht mit ID ${id} nicht gefunden`);
    }

    const { categoryId, description, price, isActive, ...restlicheDaten } =
      productData;

    if (categoryId) {
      product.category = { id: Number(categoryId) } as CategoryEntity;
    }

    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (isActive !== undefined) product.isActive = isActive;

    Object.assign(product, restlicheDaten);
    return await this.productRepository.save(product);
  }

  async addIngredient(
    productId: number,
    ingredientData: AddIngredientInputDto,
  ) {
    const product = await this.productRepository.findOne({
      where: { id: Number(productId) },
    });
    if (!product) {
      throw new NotFoundException(`Produkt mit ID ${productId} nicht gefunden`);
    }

    const newIngredient = this.ingredientRepository.create({
      name: ingredientData.name,
      extraPrice: Number(ingredientData.price),
      products: [product],
    });

    return await this.ingredientRepository.save(newIngredient);
  }

  async updateIngredient(id: number, ingredientData: UpdateIngredientDto) {
    const ingredient = await this.ingredientRepository.findOne({
      where: { id },
    });
    if (!ingredient) {
      throw new NotFoundException(`Zutat mit ID ${id} nicht gefunden`);
    }
    Object.assign(ingredient, ingredientData);
    return await this.ingredientRepository.save(ingredient);
  }

  async deleteProduct(id: number) {
    const product = await this.productRepository.findOne({
      where: { id: Number(id) },
    });
    if (!product) {
      throw new NotFoundException(`Gericht mit ID ${id} nicht gefunden`);
    }
    return await this.productRepository.remove(product);
  }

  async deleteIngredient(id: number) {
    const ingredient = await this.ingredientRepository.findOne({
      where: { id },
    });
    if (!ingredient) {
      throw new NotFoundException(`Zutat mit ID ${id} nicht gefunden`);
    }
    return await this.ingredientRepository.remove(ingredient);
  }
}
