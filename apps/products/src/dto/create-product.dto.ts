import { IsNumber, IsString, MinLength } from "class-validator";

export class CreateProductDto {
    @IsString()
    name: string;
    @IsString()
    @MinLength(5)
    description: string;
    @IsNumber()
    price: number;
    @IsNumber()
    stock: number;
}