import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import {
  incrementVersionOnUpdate,
  newDocumentOnUpdate,
} from '../plugins/mongoose-plugins';
import { globalSchema } from '../plugins/global-schema.plugin';

@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createMongooseOptions():
    | MongooseModuleOptions
    | Promise<MongooseModuleOptions> {
    return {
      uri: this.configService.get('database.uri'),
      dbName: this.configService.get('database.name'),
      autoIndex: true,
      connectionFactory: (connection) => {
        [
          incrementVersionOnUpdate,
          newDocumentOnUpdate,
          globalSchema,
        ].forEach((plugin) => connection.plugin(plugin));
        return connection;
      },
    };
  }
}