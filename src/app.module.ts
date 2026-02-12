import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SongsModule } from './modules/songs/songs.module';
import { AlbumsModule } from './modules/albums/albums.module';
import { PlaylistsModule } from './modules/playlists/playlists.module';
import { EventsModule } from './modules/events/events.module';
import { GenresModule } from './modules/genres/genres.module';
import { MoodsModule } from './modules/moods/moods.module';
import { CreatorsModule } from './modules/creators/creators.module';
import { ResidentsModule } from './modules/residents/residents.module';
import { SubscribersModule } from './modules/subscribers/subscribers.module';
import { ProductsModule } from './modules/products/products.module';
import { ProgramModule } from './modules/program/program.module';
import { PicksModule } from './modules/picks/picks.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UploadModule } from './modules/upload/upload.module';
import { HistoryModule } from './modules/history/history.module';
import { HighlightsModule } from './modules/highlights/highlights.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting - Protection against DDoS and brute force attacks
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => [
        {
          name: 'short',
          ttl: 1000, // 1 second
          limit: 3, // 3 requests per second
        },
        {
          name: 'medium',
          ttl: 10000, // 10 seconds
          limit: 20, // 20 requests per 10 seconds
        },
        {
          name: 'long',
          ttl: 60000, // 1 minute
          limit: 100, // 100 requests per minute
        },
      ],
    }),

    // Database: pakai DATABASE_URL (atau fallback ke DB_HOST/DB_PORT/...)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const useSsl = databaseUrl
          ? !databaseUrl.includes('localhost')
          : configService.get('DB_HOST') !== 'localhost';
        const base = {
          type: 'postgres' as const,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') === 'development',
          logging: configService.get('NODE_ENV') === 'development',
          timezone: 'Asia/Jakarta',
          extra: {
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            options: '-c timezone=Asia/Jakarta',
          },
          ssl: useSsl ? { rejectUnauthorized: false } : false,
        };
        if (databaseUrl) {
          return { ...base, url: databaseUrl };
        }
        return {
          ...base,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'otr_db'),
        };
      },
      inject: [ConfigService],
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    SongsModule,
    AlbumsModule,
    PlaylistsModule,
    EventsModule,
    GenresModule,
    MoodsModule,
    CreatorsModule,
    ResidentsModule,
    SubscribersModule,
    ProductsModule,
    ProgramModule,
    PicksModule,
    SettingsModule,
    UploadModule,
    HistoryModule,
    HighlightsModule,
  ],
  providers: [
    // Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
