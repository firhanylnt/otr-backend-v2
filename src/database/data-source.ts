import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const useSsl = databaseUrl ? !databaseUrl.includes('localhost') : (process.env.DB_HOST || 'localhost') !== 'localhost';

export const dataSourceOptions: DataSourceOptions = databaseUrl
  ? {
      type: 'postgres',
      url: databaseUrl,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      extra: { timezone: 'Asia/Jakarta' },
    }
  : {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'otr_db',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      extra: { timezone: 'Asia/Jakarta' },
    };

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;

