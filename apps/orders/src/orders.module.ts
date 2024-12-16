import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { AuthModule } from '@auth/auth/auth.module';
import { CommonModule } from 'common/modules/common.module';
import { MongooseConfigService } from 'common/config/mongoose.config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import orderConfig from './config/config'
import { ORDER_EXCHANGE } from 'shared/events/order.events';
import { ProductEvents } from 'shared/events/product.events';
import { UserEvents } from 'shared/events/user.events';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema,
      },
    ]),
    CommonModule.forService(orderConfig,MongooseConfigService,[
      {name : ORDER_EXCHANGE}
    ]),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: 
          `${config.get('JWT_EXPIRATION')}s` },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService,ProductEvents,UserEvents],
})
export class OrdersModule {}
