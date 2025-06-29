import { Test, TestingModule } from '@nestjs/testing';
import { SteamAuthController } from './auth.controller';
import { SteamAuthService } from './auth.service';
import { AbstractLogin } from './abstract/abstract.login';
import { FileCookiePersistenceService } from '../cookies-persistance/cookies-persistance.service';
import { HttpCommunicationProvider } from '@backend/communication';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

describe('SteamAuthController', () => {
  let controller: SteamAuthController;
  let steamAuthService: jest.Mocked<SteamAuthService>;
  let abstractLogin: jest.Mocked<AbstractLogin>;
  let cookiesPersistance: jest.Mocked<FileCookiePersistenceService>;
  let httpCommunicationProvider: jest.Mocked<HttpCommunicationProvider>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SteamAuthController],
      providers: [
        { provide: SteamAuthService, useValue: { login: jest.fn() } },
        { provide: AbstractLogin, useValue: { execute: jest.fn() } },
        { provide: FileCookiePersistenceService, useValue: { loadCookiesFromFile: jest.fn(), saveCookiesToFile: jest.fn() } },
        { provide: HttpCommunicationProvider, useValue: { sendWithState: jest.fn() } },
        { provide: ConfigService, useValue: { getOrThrow: jest.fn() } },
      ],
    }).compile();

    controller = module.get<SteamAuthController>(SteamAuthController);
    steamAuthService = module.get(SteamAuthService);
    abstractLogin = module.get(AbstractLogin);
    cookiesPersistance = module.get(FileCookiePersistenceService);
    httpCommunicationProvider = module.get(HttpCommunicationProvider);
    configService = module.get(ConfigService);
  });

  describe('login', () => {
    it('should call abstractLogin.execute and send response with result object', async () => {
        // arrange
        const parsedData = {
            username: 'testUser',
            password: 'testPassword',
            inviteCode: 'invite',
        };

        const mockRes = {
            send: jest.fn(),
        } as unknown as Response;

        const expectedResult = { success: false };

        // Мокаем выполнение abstractLogin
        abstractLogin.execute.mockResolvedValue(expectedResult);

        // act
        await controller.login(parsedData, mockRes);

        // assert
        expect(abstractLogin.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                parsedBody: parsedData,
                taskName: 'login',
                options: { closePage: true },
            })
        );

        expect(mockRes.send).toHaveBeenCalledWith(expectedResult);
    });

       it('should call abstractLogin.execute and send response with false', async () => {
        // arrange
        const parsedData = {
            username: '',
            password: 'testPassword',
            inviteCode: 'invite',
        };

        const mockRes = {
            send: jest.fn(),
        } as unknown as Response;

        const expectedResult = { success: false };

        // Мокаем выполнение abstractLogin
        abstractLogin.execute.mockResolvedValue(false);

        // act
        await controller.login(parsedData, mockRes);

        // assert
        expect(abstractLogin.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                parsedBody: parsedData,
                taskName: 'login',
                options: { closePage: true },
            })
        );

        expect(mockRes.send).toHaveBeenCalledWith(expectedResult);
    });

       it('should call abstractLogin.execute and send response with false', async () => {
        // arrange
        const parsedData = {
            username: 'fff',
            password: '',
            inviteCode: 'ff',
        };

        const mockRes = {
            send: jest.fn(),
        } as unknown as Response;

        const expectedResult = { success: false };

        // Мокаем выполнение abstractLogin
        abstractLogin.execute.mockResolvedValue(false);

        // act
        await controller.login(parsedData, mockRes);

        // assert
        expect(abstractLogin.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                parsedBody: parsedData,
                taskName: 'login',
                options: { closePage: true },
            })
        );

        expect(mockRes.send).toHaveBeenCalledWith(expectedResult);
    });

    it('should call abstractLogin.execute and send response with false', async () => {
        // arrange
        const parsedData = {
            username: 'fff',
            password: 'testPassword',
            inviteCode: '',
        };

        const mockRes = {
            send: jest.fn(),
        } as unknown as Response;

        const expectedResult = { success: false };

        // Мокаем выполнение abstractLogin
        abstractLogin.execute.mockResolvedValue(false);

        // act
        await controller.login(parsedData, mockRes);

        // assert
        expect(abstractLogin.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                parsedBody: parsedData,
                taskName: 'login',
                options: { closePage: true },
            })
        );

        expect(mockRes.send).toHaveBeenCalledWith(expectedResult);
    });

    it('should call abstractLogin.execute and send response as steam guard user account', async () => {
        // arrange
        const parsedData = {
            username: 'testUsername',
            password: 'testPassword',
            inviteCode: 'invite',
        };

        const mockRes = {
            send: jest.fn(),
        } as unknown as Response;

        const expectedResult = { success: true, guardState: "SGInput" };

        // Мокаем выполнение abstractLogin
        abstractLogin.execute.mockResolvedValue(expectedResult);

        // act
        await controller.login(parsedData, mockRes);

        // assert
        expect(abstractLogin.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                parsedBody: parsedData,
                taskName: 'login',
                options: { closePage: true },
            })
        );

        expect(mockRes.send).toHaveBeenCalledWith(expectedResult);
    });
  })
});