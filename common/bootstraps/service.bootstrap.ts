import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as cookieParser from "cookie-parser";

export async function bootstrap(
    AppModule,
    validationPipeOptions = {
        whitelist: true,
        transform: true,
    }){
    const app = await NestFactory.create<NestExpressApplication>(AppModule)    
    app.useGlobalPipes(new ValidationPipe(validationPipeOptions))
    const configService = app.get(ConfigService);
    app.use(cookieParser());
  await app.listen(configService.get('port')).then(() => {
  });
}