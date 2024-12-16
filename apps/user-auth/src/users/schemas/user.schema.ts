import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
export type UserDocument = User & mongoose.Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  email: string;

  comparePassword: (password: string) => Promise<boolean>;
}
export const UserSchema = SchemaFactory.createForClass(User);


UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
};

UserSchema.pre('save', async function (next) {

    try{
        if(this.isModified('password') || this.password) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
    }
    catch(e) {
        console.log(e);
    }
    next();
});