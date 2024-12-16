import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './types/user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { RedisService } from 'common/services/redis.service';

@Injectable()
export class UsersService {
    constructor(
        private readonly redisService: RedisService,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>
    ) {}
    async create(user: CreateUserDto):Promise<any> {
        try {
            const createdUser = new this.userModel(user);
            return createdUser.save();
        } catch (error) {
            if (error.code === 11000) {
                // Handle duplicate key error
                throw new ConflictException('Username or email already exists');
            } else {
                // Handle other kinds of database errors
                throw new BadRequestException('Failed to create user');
            }
        }
    }

    async findByEmail(email: string): Promise<UserDocument | undefined | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async login(email: string, password: string): Promise<any> {
        const user = await this.userModel.findOne({email});
        if (!user || !await user.comparePassword(password)) {
            throw new UnauthorizedException('Credentials are invalid');
        }
        return { message: 'Login successful', user };
    }

     async getUserById(id: string): Promise<any> {
        const cacheKey = `user:${id}`;
        const cachedUser = await this.redisService.get(cacheKey);
        if (cachedUser) {
          return JSON.parse(cachedUser);
        }
        const user = await this.userModel.findById(id).exec();
        if (user) await this.redisService.set(cacheKey, JSON.stringify(user), 7200);
        if (!user) {
        throw new UnauthorizedException('User not found');
    }
      return user;
    }
}
