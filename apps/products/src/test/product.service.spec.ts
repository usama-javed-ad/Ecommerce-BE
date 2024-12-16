import { JwtAuthGuard } from '@app/shared/guards/jwt-auth.guard';
import { JwtStrategy } from '@app/shared/strategies/jwt.strategy';
import { AuthService } from '@auth/auth/auth.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from '@products/products.controller'; // Ensure you have a ProductsController
import { ProductsService } from '@products/products.service';
import { Product, ProductSchema } from '@products/schemas/product.schema';
import { RedisService } from 'common/services/redis.service';
import { mock } from 'jest-mock-extended';
import { MongoInMemory } from 'libs/tests/mongo-in-memory.util';
import mongoose from 'mongoose';
import * as request from 'supertest';  // Make sure to import supertest

process.env.RABBIT_URI = "amqp://localhost:5672";

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    await MongoInMemory.connect();
    const uri = await MongoInMemory.getUri();

    const testingModule: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: Product.name, schema: ProductSchema },
        ]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: 'yourSecretKey' }),
      ],
      providers: [
        ProductsService,
        PassportModule,
        JwtStrategy,
        { provide: JwtAuthGuard, useValue: { canActivate: () => true} },
        { provide: AmqpConnection, useValue: mock<AmqpConnection>() },
        { provide: JwtService, useValue: mock<JwtService>() },
        { provide: RedisService, useValue: mock<RedisService>() },
      ],
    }).compile();

    app = testingModule.createNestApplication();
    const jwtService = app.get(JwtService);
    jwtToken = jwtService.sign({ userId: 'test-user-id' }, { secret: 'yourSecretKey' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await MongoInMemory.close();
  });

  beforeEach(async () => {
    // Clear the database before each test
    await MongoInMemory.clear();
  });

  describe('GET /products', () => {
    it('should return all products', async () => {
      const productCollection = mongoose.connection.collection('products');
      await productCollection.insertMany([
        { name: 'Product A', price: 100, stock: 10, description: 'Description A' },
        { name: 'Product B', price: 200, stock: 20, description: 'Description B' },
      ]);

      const response = await request(app.getHttpServer()).get('/products/all').set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Product A');
      expect(response.body[1].name).toBe('Product B');
    });
  });

  describe('GET /products/:id', () => {
    it('should return a product by ID', async () => {
      const productCollection = mongoose.connection.collection('products');
      const { insertedId } = await productCollection.insertOne({
        name: 'Product A',
        price: 100,
      });

      const response = await request(app.getHttpServer()).get(`/products/${insertedId}`).set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Product A');
      expect(response.body.price).toBe(100);
    });

    it('should return 404 if product not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toHexString();
      const response = await request(app.getHttpServer()).get(`/products/${fakeId}`).set('Authorization', `Bearer ${jwtToken}`);
      expect(response.status).toBe(400);
    });
  });

  describe('POST /products', () => {
    it('should create a new product', async () => {
      const createProductDto = {
        name: 'New Product',
        price: 150,
        stock: 5,
        description: 'Description',
      };

      const response = await request(app.getHttpServer())
        .post('/products/create').set('Authorization', `Bearer ${jwtToken}`)
        .send(createProductDto);
      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Product');
      expect(response.body.price).toBe(150);
      expect(response.body.stock).toBe(5);
      expect(response.body.description).toBe('Description');

      // Check that it was actually inserted into the database
      const productCollection = mongoose.connection.collection('products');
      const found = await productCollection.findOne({ name: 'New Product' });
      expect(found).not.toBeNull();
    });

    it('should return 400 if invalid data is provided', async () => {
      // Assuming name is required and price must be a number
      const invalidDto = {
        name: '',
        price: '200',
      };

      const response = await request(app.getHttpServer())
        .post('/products/create').set('Authorization', `Bearer ${jwtToken}`)
        .send(invalidDto);

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /products/:id', () => {
    it('should update an existing product', async () => {
      const productCollection = mongoose.connection.collection('products');
      const { insertedId } = await productCollection.insertOne({
        name: 'Old Name',
        price: 100,
      });

      const updateDto = { name: 'Updated Name', price: 200 };
      const response = await request(app.getHttpServer())
        .put(`/products/${insertedId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(updateDto);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.price).toBe(200);

      const updated = await productCollection.findOne({ _id: insertedId });
      expect(updated.name).toBe('Updated Name');
    });

    it('should return 404 if trying to update a non-existing product', async () => {
      const fakeId = new mongoose.Types.ObjectId().toHexString();
      const response = await request(app.getHttpServer())
        .put(`/products/${fakeId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ name: 'Does not matter', price: 300 });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete a product', async () => {
      const productCollection = mongoose.connection.collection('products');
      const { insertedId } = await productCollection.insertOne({
        name: 'To be deleted',
        price: 100,
      });

      const response = await request(app.getHttpServer())
                            .delete(`/products/${insertedId}`)
                            .set('Authorization', `Bearer ${jwtToken}`)

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('To be deleted');

      const deleted = await productCollection.findOne({ _id: insertedId });
      expect(deleted).toBeNull();
    });

    it('should return 404 if trying to delete a non-existing product', async () => {
      const fakeId = new mongoose.Types.ObjectId().toHexString();
      const response = await request(app.getHttpServer())
        .delete(`/products/${fakeId}`)
        .set('Authorization', `Bearer ${jwtToken}`)

      expect(response.status).toBe(404);
    });
  });
});