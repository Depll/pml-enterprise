import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KategorieEntity } from './database/entities/kategorie.entity';
import { ProduktEntity } from './database/entities/produkt.entity';
import { ZutatEntity } from './database/entities/zutat.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [KategorieEntity, ProduktEntity, ZutatEntity], // <-- 2. Hier mit ins Array werfen!
        synchronize: true,
        logging: true,
      }),
    }),
  ],
})
export class AppModule {}
