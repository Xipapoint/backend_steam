import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { AppModule } from '../../../steam-auth/src/app/app.module';
 
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PuppeteerService } from '../../../steam-auth/src/app/puppeteer/puppeteer.service';

const puppeteerServiceMock = {
  executePuppeteerTask: jest.fn().mockImplementation(async (username, taskName, taskFn) => {
    return await taskFn({ mock: 'page' }); // мокнутый puppeteer.Page
  }),
  deleteContext: jest.fn(),
};

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PuppeteerService)
      .useValue(puppeteerServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  it('/auth/login (POST) — успешный логин', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'test_user',
        password: 'test_password',
        inviteCode: 'test_invite',
      })
      .expect(200);

    expect(response.body).toHaveProperty('success');
  });

  it('/auth/login (POST) — ошибка валидации', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: '',
        password: '',
        inviteCode: '',
      })
      .expect(400);

    expect(response.body.message).toBeDefined();
    expect(response.body.statusCode).toBe(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
