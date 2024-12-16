import {
    RabbitHandlerType,
    RabbitMQChannels,
    RabbitMQConfig,
    RabbitMQModule,
  } from '@golevelup/nestjs-rabbitmq';
  import rabbitConnectionConfig from '../config/rabbit.config'
  
  export type RabbitMQConfigOptions = Pick<
    RabbitMQConfig,
    'name' | 'exchanges'
  > & {
    subscribePrefetchCount?: number;
  };
  
  export const RabbitHandlerTypes: { [K in RabbitHandlerType]: K } = {
    rpc: 'rpc',
    subscribe: 'subscribe',
  };
  
  /**
   * Exchange Types:
   * Direct: Routing key === Queue Name
   * Topic: Routing key + Wildcards
   * Fanout: Broadcast
   * Header: Match Headers
   */
  export function RegisterRabbitModule(
    rabbitMQConfigOptions: RabbitMQConfigOptions,
  ) {
    const connectionConfig = rabbitConnectionConfig();
    console.log("🚀 ~ connectionConfig:", connectionConfig)
    const channels: RabbitMQChannels = {};
  
    if (
      rabbitMQConfigOptions?.subscribePrefetchCount &&
      rabbitMQConfigOptions.subscribePrefetchCount > 0
    ) {
      channels[RabbitHandlerTypes.subscribe] = {
        prefetchCount: rabbitMQConfigOptions.subscribePrefetchCount,
        default: false,
      };
  
      delete rabbitMQConfigOptions.subscribePrefetchCount;
    }
  
    const rabbitMQConfig: RabbitMQConfig = {
      uri: connectionConfig.rabbitUri,
      enableControllerDiscovery: true,
      connectionInitOptions: { wait: false, timeout: 130000 },
      ...rabbitMQConfigOptions,
      channels,
    };
  
    return RabbitMQModule.forRoot(RabbitMQModule, rabbitMQConfig);
  }  