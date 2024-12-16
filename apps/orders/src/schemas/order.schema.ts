import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({
  timestamps: true,
})
export class Order {
  @Prop({ type: Types.ObjectId,required: true })
  productId: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ type:Types.ObjectId, required: true })
  userId: string;

  @Prop({ default: 'pending' })
  status: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
