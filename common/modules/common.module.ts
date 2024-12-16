import {
    RabbitMQExchangeConfig,
    RabbitMQModule,
  } from '@golevelup/nestjs-rabbitmq';
  
  import { ConfigModule, ConfigService } from '@nestjs/config';
  import {
    DynamicModule,
    Module,
    Type,
  } from '@nestjs/common';
  
  import { MongooseModule, MongooseOptionsFactory } from '@nestjs/mongoose';
  import { RabbitMQConfigOptions, RegisterRabbitModule } from './rabbit.module';
  import { JwtStrategy } from '@app/shared/strategies/jwt.strategy'
  import { APP_FILTER } from '@nestjs/core';
  import * as Joi from 'joi';
  import mongoose from 'mongoose';  
  import globalConfig  from '../../shared/config/global.config';
  
  @Module({
    imports: [],
    providers: [JwtStrategy, ConfigService],
    controllers: [],
  })
  export class CommonModule {
    static forService(
      config,
      MongooseConfigService?: Type<MongooseOptionsFactory>,
      // If service wants to expose data, exchange name should be mentioned in an object like this {name: ROLES_PERMISSIONS}
      // If service only wants to access data from other service, param should be empty array [] which ensures that connection is established with RabbitMQ
      // If service doesn't want to expose or access data to/from other service send null as param
      rabbitExchanges: RabbitMQExchangeConfig[] = [], // for backward compatibility, it needs to be shifted into 'rabbitMQConfig', when passing from the service
      rabbitMQConfig: RabbitMQConfigOptions = { exchanges: [] },
    ): DynamicModule {
      const serviceName = config()['general']['name'];
      
      rabbitMQConfig.name = serviceName;
      rabbitMQConfig.exchanges = rabbitExchanges
        ? [...rabbitMQConfig.exchanges, ...rabbitExchanges]
        : rabbitMQConfig.exchanges;
  
      const imports: Required<DynamicModule>['imports'] = [
        ConfigModule.forRoot({
          load: [globalConfig,config],
          isGlobal: true,
          envFilePath: `${process.cwd()}/apps/${serviceName}/.env`,
          validationSchema: Joi.object({
            JWT_SECRET: Joi.string().required(),
            JWT_EXPIRATION: Joi.string().required(),
          }),
        }),
        RegisterRabbitModule(rabbitMQConfig),
      ];
      const exports: Required<DynamicModule>['exports'] = [
        ConfigModule,
        RabbitMQModule,
      ];
  
      if (MongooseConfigService) {
        imports.push(
          MongooseModule.forRootAsync({
            useClass: MongooseConfigService,
          }),
        );
        exports.push(MongooseModule);
      }
      return {
        module: CommonModule,
        imports,
        exports,
      };
    }
  }  