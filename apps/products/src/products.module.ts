import { forwardRef, Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { CommonModule } from 'common/modules/common.module';
import productConfig from './config/config'
import { MongooseConfigService } from 'common/config/mongoose.config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PRODUCT_EXCHANGE } from 'shared/events/product.events';

@Module({
  imports: [
    MongooseModule.forFeature([{name: Product.name, schema: ProductSchema}]),
    CommonModule.forService(productConfig,MongooseConfigService,[
      {name : PRODUCT_EXCHANGE}
    ]),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: 
          `${config.get('JWT_EXPIRATION')}s` },
      }),
      inject: [ConfigService],
    })
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
