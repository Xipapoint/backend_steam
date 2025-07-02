import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from '@backend/database'; // Убедитесь, что этот путь верен

const configService = new ConfigService();
const options = getTypeOrmConfig(configService);

console.log('Resolved TypeORM Config', options);

export const AppDataSource = new DataSource(options);