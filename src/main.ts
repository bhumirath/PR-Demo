import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174'];
  app.enableCors({ origin: allowedOrigins, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  const publicPath = join(__dirname, '..', '..', 'public');

  // Serve React build static files
  app.useStaticAssets(publicPath);

  // SPA fallback: non-API routes serve index.html (runs before NestJS router)
  app.use((req: any, res: any, next: any) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(join(publicPath, 'index.html'));
    } else {
      next();
    }
  });

  await app.listen(process.env.PORT ?? 3000);

  console.log(`Backend running on http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
