import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ApiModule } from './api/api.module';

@Module({
  imports: [ApiModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
