import { Schema } from 'mongoose';

export function globalSchema(schema: Schema) {
  schema.set('id', false);
}