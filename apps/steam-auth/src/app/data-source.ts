import { getTypeOrmConfig } from '@backend/database'; // Убедитесь, что этот путь верен
import 'dotenv/config';
import { DataSource } from 'typeorm';

const options = getTypeOrmConfig(__dirname);

console.log('Resolved TypeORM Config', options);

export const AppDataSource = new DataSource(options);