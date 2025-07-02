import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from '@backend/database';

const configService = new ConfigService();

export const AppDataSource = new DataSource(
  getTypeOrmConfig(configService)
);

export default AppDataSource;