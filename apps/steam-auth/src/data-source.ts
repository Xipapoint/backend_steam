import * as entities from './app/auth/entities'
import * as migrations from './app/shared/migrations'
import 'dotenv/config';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'IstrMart0231/',
    database: 'postgres',
    entities: entities,
    migrations: migrations,
    synchronize: false,
    logging: true,
});