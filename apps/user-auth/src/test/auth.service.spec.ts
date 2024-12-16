import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { MongoInMemory } from 'libs/tests/mongo-in-memory.util';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UsersService } from '@auth/users/users.service';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { UsersController } from '@auth/users/users.controller';
import { mock } from 'jest-mock-extended';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { RedisService } from 'common/services/redis.service';
import { HydratedDocument, Model } from 'mongoose';

process.env.RABBIT_URI="amqp://localhost:5672";

describe('Auth Tests', () => {
  let authService: AuthService;
  let app: INestApplication;
  let userModel: Model<HydratedDocument<User>>;

  beforeAll(async () => {
    await MongoInMemory.connect();
    // userModel = mongoose.model<User>('User', UserSchema);
  });

  afterAll(async () => {
    await MongoInMemory.close();
  });

  afterEach(async () => {
    await MongoInMemory.clear();
  });

  let testingModule: TestingModule;

  beforeEach(async () => {
    const uri = await MongoInMemory.getUri();
     testingModule = await Test.createTestingModule({
      controllers: [UsersController],
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: User.name, schema: UserSchema },
        ]),
      ],
      providers: [
        AuthService,
        UsersService,
        { provide: AmqpConnection, useValue: mock<AmqpConnection>() },
        {provide: JwtService, useValue: mock<JwtService>()},
        {provide: RedisService, useValue: mock<RedisService>()},
      ],
    }).compile();
    app = testingModule.createNestApplication();
    await app.init();
    authService = testingModule.get<AuthService>(AuthService);
    userModel = app.get(getModelToken(User.name))
  });

  it('should validate a user with correct email and password', async () => {
    // Arrange
    const email = 'testuser@example.com';
    const plainPassword = 'password123';
    const hashedPassword = 'hashedPassword';
  
    const mockUser = {
      email,
      password: hashedPassword,
      username: 'testusername', // Add this if required by User schema
      comparePassword: jest.fn().mockResolvedValueOnce(true), // Mock the schema method
      toObject: () => ({ email, password: hashedPassword }),
    };
  
    const usersService = testingModule.get<UsersService>(UsersService)
    jest.spyOn(usersService,"findByEmail").mockResolvedValueOnce(mockUser as any);
    // Act
    const result = await authService.validateUser(email, plainPassword);
  
    // Assert
    expect(mockUser.comparePassword).toHaveBeenCalledWith(plainPassword);    
    expect(result).toEqual({ email });
  });
  

  it('should return null if email does not exist', async () => {
    const email = 'nonexistent@example.com';
    const password = 'password123';

    const result = await authService.validateUser(email, password);

    expect(result).toBeNull();
  });

  describe('/users/signup (POST)', () => {
    it('should register a new user', async () => {

      const testUser = {
        email: 'testuser@example.com',
        password: 'password123',
        username: 'testusername',
      }
      const response = await request(app.getHttpServer())
        .post('/users/signup')
        .send(testUser);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('testuser@example.com');
    });

    it('/auth/login (POST) - should login successfully and return a token', async () => {
      await userModel.create({
        username: 'testuser',
        email: 'loginuser@example.com',
        password: 'hashedPassword123',
      });

      const response = await request(app.getHttpServer())
        .post('/users/login')
        .send({ username: 'testuser', email: 'loginuser@example.com', password: 'hashedPassword123' });
      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('jwt')
    });
  });
});
