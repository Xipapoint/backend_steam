import 'dotenv/config';
import { AppDataSource } from './src/data-source'; // Путь относительный к temp-loader.ts

console.log('--- temp-loader.ts: Загружаю data-source.ts ---');

if (AppDataSource && AppDataSource.options) {
    console.log('--- temp-loader.ts: AppDataSource успешно загружен! ---');
    console.log('Конфигурация TypeORM:', AppDataSource.options);
} else {
    console.error('--- temp-loader.ts: AppDataSource НЕ загружен или некорректен! ---');
}

AppDataSource.initialize()
    .then(() => {
        console.log('--- temp-loader.ts: Соединение с базой данных успешно! ---');
        return AppDataSource.destroy();
    })
    .catch(err => {
        console.error('--- temp-loader.ts: Ошибка соединения с базой данных: ---', err);
        console.error(err); // Выведите сам объект ошибки
    });