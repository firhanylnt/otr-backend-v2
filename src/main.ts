import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimezoneInterceptor } from './common/interceptors/timezone.interceptor';

// Set timezone to Jakarta (UTC+7)
process.env.TZ = 'Asia/Jakarta';

/**
 * Create NestJS application (used by main bootstrap and Vercel serverless).
 */
export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ============== SECURITY MIDDLEWARE ==============
  
  // Helmet - Sets various HTTP headers for security
  app.use(helmet({
    crossOriginEmbedderPolicy: false, // Allow embedding for audio/video
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin resources
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        mediaSrc: ["'self'", 'https:', 'blob:'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        connectSrc: ["'self'", 'https:', 'wss:'],
      },
    },
  }));

  // Compression - Gzip compression for responses
  app.use(compression());

  // Trust proxy (if behind reverse proxy like nginx)
  app.set('trust proxy', 1);

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimezoneInterceptor(), // Convert all dates to Jakarta timezone (UTC+7)
  );

  // Serve static files (uploads)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable CORS with security options
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3002',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3005',
      ];
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 3600, // Cache preflight requests for 1 hour
  });

  // Global validation pipe with security options
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // Hide error details in production
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation (only in development)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('On The Records API')
      .setDescription('Backend API for On The Records music platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Songs', 'Song management')
      .addTag('Albums', 'Album management')
      .addTag('Events', 'Event management')
      .addTag('Users', 'User management')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  return app;
}

// Default export agar Vercel tidak mengeluh "default export must be a function" bila main.js ikut di-load
export default createApp;

async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT || 3005;
  await app.listen(port);
  console.log(`🚀 OTR Backend running on: http://localhost:${port}`);
  console.log(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
  }
}

// Only run server when not in Vercel serverless
if (process.env.VERCEL !== '1') {
  bootstrap();
}
