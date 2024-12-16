import { IsNumber, IsString } from "class-validator";

export class CreateOrderDto {
    @IsString()
    productId: string;
    @IsNumber()
    quantity: number;
}