import { getTypeOrmConfig } from '@backend/database';
import 'dotenv/config';
import { DataSource } from 'typeorm';

const options = getTypeOrmConfig(__dirname);

console.log('Resolved TypeORM Config', options);

export const AppDataSource = new DataSource(options);