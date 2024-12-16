// import { NestFactory } from '@nestjs/core';
// import * as cookieParser from 'cookie-parser';
// import { ValidationPipe } from '@nestjs/common';
import { bootstrap } from 'common/bootstraps/service.bootstrap';
import { UsersModule } from './users/users.module';

bootstrap(UsersModule)
