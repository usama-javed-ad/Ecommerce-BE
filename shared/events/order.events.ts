import { Injectable } from '@nestjs/common';
import { Events } from 'common/base/events';

export const ORDER_EXCHANGE = 'order';
const ORDER_CREATED_EVENT = 'order.created';
const CHECK_STOCK_EVENT = 'product.stock.check';

@Injectable()
export class OrderEvents extends Events {
  /** Check Stock */
  async checkStock(productId: string, quantity: number) {
    return this.request<any>(CHECK_STOCK_EVENT, ORDER_EXCHANGE, {
      productId,
      quantity,
    });
  }

  /** Publish Order Created Event */
  publishOrderCreatedEvent(orderDetails: {
    orderId: string;
    productId: string;
    quantity: number;
  }) {
    this.request(ORDER_EXCHANGE, ORDER_CREATED_EVENT, orderDetails);
  }

//   /** Handle Order Created Event (optional if needed for subscription) */
//   static handleOrderCreatedEvent() {
//     return Events.subscribeQueue(
//       ORDER_CREATED_EVENT,
//       ORDER_EXCHANGE,
//       'order-created-queue',
//     );
//   }
}