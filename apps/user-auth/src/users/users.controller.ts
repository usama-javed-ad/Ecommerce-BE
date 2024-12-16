import { Body, ConflictException, Controller, HttpCode, HttpStatus, Param, Post, Res, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './types/user.dto';
import { AuthService } from '../auth/auth.service';
import { response, Response } from 'express';
import { UserEvents } from '../../../../shared/events/user.events';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService
    ) {}

    @Post('signup')
    async signup(@Body() body: CreateUserDto, @Res({ passthrough: true }) response: Response) {        
        const existingUser = await this.usersService.findByEmail(body.email);
        if (existingUser) throw new ConflictException('User already exist');
        const user = await this.usersService.create(body);
        if (user){
            const token = await this.authService.login(user);
            const { password, ...result } = user.toObject();
            response.cookie('jwt', token.access_token, {
                httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
                secure: process.env.NODE_ENV === 'production', // Ensures the browser only sends the cookie over HTTPS
                sameSite: 'strict', // Helps prevent CSRF attacks
                maxAge: 3600000, // 1 hour in milliseconds
            });
            return {
                message: 'Signup successful',
                user: result,
            };
        }
        else{
            return {
                message: 'Signup failed',
            };
        }
     
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() body: { email: string; password: string },@Res({ passthrough: true }) response: Response) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) throw new UnauthorizedException();
        const token = await this.authService.login(user);
        response.cookie('jwt', token.access_token, {
            httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
            secure: process.env.NODE_ENV === 'production', // Ensures the browser only sends the cookie over HTTPS
            sameSite: 'strict', // Helps prevent CSRF attacks
            maxAge: 7200000, // 2 hour in milliseconds
          });
          return {
            message: 'Login successful',
            user,
          };
    }

    // @UserEvents.GetUserById()
    // async getUserById(id: string) {
    //     return this.usersService.getUserById(id);
    // }
}
