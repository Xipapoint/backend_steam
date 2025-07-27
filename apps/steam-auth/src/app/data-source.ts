import * as entities from './auth/entities'
import * as migrations from './shared/migrations'
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const DBConfig: DataSourceOptions = {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'password',
    database: 'postgres',
    entities: entities,
    migrations: migrations,
    synchronize: false,
    logging: true,
}

export const AppDataSource = new DataSource(DBConfig);