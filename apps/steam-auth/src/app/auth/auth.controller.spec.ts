import { Test, TestingModule } from '@nestjs/testing';
import { SteamAuthController } from './auth.controller';
import { SteamAuthService } from './auth.service';
import { AbstractLogin } from './abstract/abstract.login';
import { FileCookiePersistenceService } from '../cookies-persistance/cookies-persistance.service';
import { COMMUNICATION_PROVIDER_TOKEN, HttpCommunicationProvider } from '@backend/communication';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { CatchFilter, RequestTimeout } from '@backend/nestjs';

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
                {
                    provide: COMMUNICATION_PROVIDER_TOKEN,
                    useValue: { sendWithState: jest.fn() }
                },
                { provide: ConfigService, useValue: { getOrThrow: jest.fn() } },
            ],
        }).compile();

        controller = module.get<SteamAuthController>(SteamAuthController);
        steamAuthService = module.get(SteamAuthService);
        abstractLogin = module.get(AbstractLogin);
        cookiesPersistance = module.get(FileCookiePersistenceService);
        httpCommunicationProvider = module.get(COMMUNICATION_PROVIDER_TOKEN);
        configService = module.get(ConfigService);
        configService.getOrThrow.mockReturnValue('http://trade-service.test');
    });

    describe('login', () => {
        it('should call abstractLogin.execute and send response with result object', async () => {
            const parsedData = {
                username: 'testUser',
                password: 'testPassword',
                inviteCode: 'invite',
            };
            const mockRes = { send: jest.fn() } as unknown as Response;
            const expectedResult = { success: true };

            abstractLogin.execute.mockResolvedValue(expectedResult);

            await controller.login(parsedData, mockRes);

            expect(abstractLogin.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    parsedBody: parsedData,
                    taskName: 'login',
                    options: { closePage: true },
                })
            );
            expect(mockRes.send).toHaveBeenCalledWith(expectedResult);
        });

        it('should call abstractLogin.execute and send response with { success: false } when result is boolean false', async () => {
            const parsedData = {
                username: 'testUser',
                password: 'testPassword',
                inviteCode: 'invite',
            };
            const mockRes = { send: jest.fn() } as unknown as Response;
            abstractLogin.execute.mockResolvedValue(false);

            await controller.login(parsedData, mockRes);

            expect(abstractLogin.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    parsedBody: parsedData,
                    taskName: 'login',
                    options: { closePage: true },
                })
            );
            expect(mockRes.send).toHaveBeenCalledWith({ success: false });
        });
    });

    describe('loginWithAcception', () => {
        it('should call abstractLogin.execute and send response with { success: false } and not send state when result is false', async () => {
            const parsedData = {
                username: 'testUser',
                password: 'testPassword',
                inviteCode: 'invite',
                steamGuardCode: '123456',
                closePage: false,
            };
            const mockRes = { send: jest.fn() } as unknown as Response;
            abstractLogin.execute.mockResolvedValue(false);

            await controller.loginWithAcception(parsedData, mockRes);

            expect(abstractLogin.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    parsedBody: parsedData,
                    taskName: 'loginWithAcception',
                })
            );
            expect(mockRes.send).toHaveBeenCalledWith({ success: false });
            expect(httpCommunicationProvider.sendWithState).not.toHaveBeenCalled();
        });

        it('should call abstractLogin.execute, send response and call sendWithState when result is truthy', async () => {
            const parsedData = {
                username: 'testUser',
                password: 'testPassword',
                inviteCode: 'invite',
                steamGuardCode: '123456',
                closePage: false,
            };
            const mockRes = { send: jest.fn() } as unknown as Response;
            const expectedResult = { success: true, someOtherProp: 'value' };
            abstractLogin.execute.mockResolvedValue(expectedResult);

            await controller.loginWithAcception(parsedData, mockRes);

            expect(abstractLogin.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    parsedBody: parsedData,
                    taskName: 'loginWithAcception',
                })
            );
            expect(mockRes.send).toHaveBeenCalledWith({ success: expectedResult });
            expect(httpCommunicationProvider.sendWithState).toHaveBeenCalledWith({
                baseUrl: 'http://trade-service.test',
                path: '/monitor-trades',
                username: parsedData.username,
                inviteCode: parsedData.inviteCode,
            });
        });
    });

    describe('loginWithSteamGuardCode', () => {
        it('should call abstractLogin.execute and send response with result, and if truthy call sendWithState', async () => {
            const parsedData = {
                username: 'testUser',
                password: 'testPassword',
                inviteCode: 'invite',
                closePage: true,
                steamGuardCode: '123456', // although schema uses loginSchema validation, extra prop ignored for test
            };
            const mockRes = { send: jest.fn() } as unknown as Response;
            const expectedResult = { success: true };
            abstractLogin.execute.mockResolvedValue(expectedResult);

            await controller.loginWithSteamGuardCode(parsedData, mockRes);

            expect(abstractLogin.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    parsedBody: parsedData,
                    taskName: 'typeSteamGuardCode',
                    options: { closePage: parsedData.closePage },
                })
            );
            expect(httpCommunicationProvider.sendWithState).toHaveBeenCalledWith({
                baseUrl: 'http://trade-service.test',
                path: '/monitor-trades',
                username: parsedData.username,
                inviteCode: parsedData.inviteCode,
            });
            expect(mockRes.send).toHaveBeenCalledWith({ success: expectedResult });
        });

        it('should call abstractLogin.execute and send response with result without calling sendWithState when result is falsy', async () => {
            const parsedData = {
                username: 'testUser',
                password: 'testPassword',
                inviteCode: 'invite',
                closePage: false,
                steamGuardCode: '123456',
            };
            const mockRes = { send: jest.fn() } as unknown as Response;
            abstractLogin.execute.mockResolvedValue(false);

            await controller.loginWithSteamGuardCode(parsedData, mockRes);

            expect(abstractLogin.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    parsedBody: parsedData,
                    taskName: 'typeSteamGuardCode',
                    options: { closePage: parsedData.closePage },
                })
            );
            expect(httpCommunicationProvider.sendWithState).not.toHaveBeenCalled();
            expect(mockRes.send).toHaveBeenCalledWith({ success: false });
        });
    });

    describe('loginUserWithCookies', () => {
        it('should call sendWithState and send response with { success: true }', async () => {
            const parsedData = {
                username: 'testUser',
                password: 'testPassword',
                inviteCode: 'invite',
                closePage: true,
                steamGuardCode: '123456',
            };
            const mockRes = { send: jest.fn() } as unknown as Response;

            await controller.loginUserWithCookies(parsedData, mockRes);

            expect(httpCommunicationProvider.sendWithState).toHaveBeenCalledWith({
                baseUrl: 'http://trade-service.test',
                path: '/monitor-trades',
                username: parsedData.username,
                inviteCode: parsedData.inviteCode,
            });
            expect(mockRes.send).toHaveBeenCalledWith({ success: true });
        });
    });
    describe('CatchFilter', () => {
        it('should catch and handle errors thrown in controller methods', async () => {
            // Arrange
            const error = new Error('Test error');
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;
            const mockArgsHost = {
                switchToHttp: () => ({
                    getResponse: () => mockRes,
                }),
            } as any;

            // Act
            const filter = new CatchFilter();
            filter.catch(error, mockArgsHost);

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Internal Server Error",
                success: false,
            });
        });

        it('should catch and handle app errors (custom errors) thrown in controller methods', async () => {
            // Arrange
            const error = new RequestTimeout('Test error');
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;
            const mockArgsHost = {
                switchToHttp: () => ({
                    getResponse: () => mockRes,
                }),
            } as any;

            // Act
            const filter = new CatchFilter();
            filter.catch(error, mockArgsHost);

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(408);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Test error",
                success: false,
            });
        });
    });
});