import {
    AmqpConnection,
    RabbitRPC,
    RabbitSubscribe,
    QueueOptions,
  } from '@golevelup/nestjs-rabbitmq';
  import {
    Logger,
    Injectable,
    Inject,
    HttpException,
  } from '@nestjs/common';
  
  interface RpcException extends HttpException {
    isException: boolean;
  }
  
  interface RabbitErrorHandlerOptions {
    channel: any;
    msg: any;
    error: any;
  }
  
  interface RpcRequestOptions {
    routingKey: string;
    exchange: string;
    queue: string;
  }
  
  interface RabbitAssertErrorHandlerOptions {
    channel: any;
    queueName: string;
    queueOptions: any;
    error: any;
  }
  
  interface RabbitRequestOptions<PayloadType> {
    exchange: string;
    routingKey: string;
    payload?: PayloadType;
    correlationId?: string;
  }
  
  @Injectable()
  export class Events {  
    @Inject(AmqpConnection)
    private readonly rabbit: AmqpConnection;
  
    private static rabbitErrorHandler(
        { routingKey, exchange, queue }: RpcRequestOptions,
        { channel, msg, error }: RabbitErrorHandlerOptions,
      ): void {
        Logger.error(error, `Rabbit Error - ${routingKey}`);
        Logger.debug({ routingKey, exchange, queue }, 'Error Related Info');
    
        //nack the messages from the queue
        channel.nack(msg, false, false);
      }
    
      private static rabbitAssertErrorHandler(
        { routingKey, exchange, queue }: RpcRequestOptions,
        { queueName, error }: RabbitAssertErrorHandlerOptions,
      ): string {
        Logger.error(error, `Rabbit Assert Error - ${routingKey} - ${queueName}`);
        Logger.debug({ routingKey, exchange, queue }, 'Error Related Info');
    
        return queueName;
      }
  
    /** RPC Request - Rabbit */
    protected async request<ReturnType>(
      routingKey: string,
      exchange: string,
      payload?,
      correlationId?: string,
    ) {
      const requestOptions: RabbitRequestOptions<any> = {
        exchange,
        routingKey,
        payload,
      };  
      // Add correlationId Into RMQ
      requestOptions.correlationId = correlationId;
  
      const response = await this.rabbit.request<ReturnType | RpcException>(
        requestOptions,
      );
      return response as ReturnType;
    }
  
    /** RPC Response Handler - Rabbit */
    protected static response(
      routingKey: string,
      exchange: string,
      queue: string,
    ) {
      return RabbitRPC({
        exchange,
        routingKey,
        queue,
        errorHandler: (channel, msg, error) =>
          Events.rabbitErrorHandler(
            { routingKey, exchange, queue },
            {
              channel,
              msg,
              error,
            },
          ),
        assertQueueErrorHandler: (channel, queueName, queueOptions, error) =>
          Events.rabbitAssertErrorHandler(
            { routingKey, exchange, queue },
            {
              channel,
              queueName,
              queueOptions,
              error,
            },
          ),
      });
    }
  
    /**
     * @description Subscribes to a RabbitMQ queue, handles errors and recovers properly if using durable queues with persistent messages.
     *
     * Durable queues: These queues are persisted to disk so they survive broker restarts.
     * Persistent messages: These messages are stored on disk as long as they haven't been delivered to all bindings/queues.
     *
     * For durability and fail-safe performance, both durable queues and persistent messages should be used together.
     *
     * @param {string} routingKey - Routing key for the queue.
     * @param {string} exchange - The name of the exchange.
     * @param {string} queue - The name of the queue.
     * @param {RabbitHandlerType} [rabbitHandlerType] - The Rabbit Handler Type.
     *
     * @returns {RabbitSubscribe} - Returns an instance of RabbitSubscribe.
     */
    protected static subscribeQueue(
      routingKey: string,
      exchange: string,
      queue: string,
      options: QueueOptions = {},
    ) {
      const queueOptions: QueueOptions = {
        ...options,
        durable: options.durable ?? true,
      };
  
      return RabbitSubscribe({
        exchange,
        routingKey,
        queue,
        queueOptions,
        errorHandler: (channel, msg, error) =>
          Events.rabbitErrorHandler(
            { routingKey, exchange, queue },
            { channel, msg, error },
          ),
        assertQueueErrorHandler: (channel, queueName, queueOptions, error) =>
          Events.rabbitAssertErrorHandler(
            { routingKey, exchange, queue },
            { channel, queueName, queueOptions, error },
          ),
      });
    }
  }  