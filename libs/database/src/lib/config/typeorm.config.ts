import { DataSourceOptions } from 'typeorm';
import * as entities from '../entities';
import * as migrations from '../migrations';

export const getTypeOrmConfig = (): DataSourceOptions => ({
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