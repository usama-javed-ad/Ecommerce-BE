import { IsEmail, MinLength } from "class-validator";

export class CreateUserDto {
    @MinLength(3)
    username: string;
    @MinLength(5)
    password: string;
    @IsEmail()
    email: string;
}