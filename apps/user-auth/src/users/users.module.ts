import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from 'common/modules/common.module';
import userConfig from '../config/config';
import { MongooseConfigService } from 'common/config/mongoose.config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { USER_EXCHANGE } from '../../../../shared/events/user.events';
import { RedisService } from 'common/services/redis.service';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => AuthModule),
    CommonModule.forService(userConfig,MongooseConfigService,[
      {name: USER_EXCHANGE}
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
  

  controllers: [UsersController],
  providers: [UsersService,RedisService],
  exports: [UsersService],
})
export class UsersModule {}
