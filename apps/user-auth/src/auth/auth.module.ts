// src/app.module.ts or src/auth/auth.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from '@app/shared/strategies/jwt.strategy';
@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'yourSecretKey', // Ensure this is securely managed
      signOptions: { expiresIn: '3600s' }, // Token expiry time
    }),
  ],
  providers: [AuthService,JwtStrategy],
  exports: [PassportModule,AuthService], // Export AuthService if it needs to be used in other modules
})
export class AuthModule {}
