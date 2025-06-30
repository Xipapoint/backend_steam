import { SteamAuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/User';
import { Test, TestingModule } from '@nestjs/testing';

describe('SteamAuthService (integration)', () => {
  let service: SteamAuthService;
  let mockPage: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SteamAuthService,
        {
          provide: getRepositoryToken(User),
          useValue: { save: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(SteamAuthService);

    mockPage = {
      waitForSelector: jest.fn(),
      type: jest.fn(),
      click: jest.fn(),
      $: jest.fn(),
    };
  });

  it('login should return false if checkForErrorLogin detects error after baseLogin', async () => {
    jest.spyOn(service as any, 'baseLogin').mockResolvedValue(true);
    jest.spyOn(service as any, 'checkForErrorLogin').mockResolvedValue(true);

    const result = await service.login(mockPage, 'testUser', 'password');
    expect(result).toBe(false);
  });

  it('login should return {success: true, guardState} if SteamGuard "SGInput"', async () => {
    jest.spyOn(service as any, 'baseLogin').mockResolvedValue(true);
    jest.spyOn(service as any, 'checkForErrorLogin').mockResolvedValue(false);
    jest.spyOn(service as any, 'detectSteamGuardState').mockResolvedValue('SGInput');

    const result = await service.login(mockPage, 'testUser', 'password');
    expect(result).toEqual({ success: true, guardState: 'SGInput' });
  });

  it('login should return true if SteamGuard state is not "SGInput"', async () => {
    jest.spyOn(service as any, 'baseLogin').mockResolvedValue(true);
    jest.spyOn(service as any, 'checkForErrorLogin').mockResolvedValue(false);
    jest.spyOn(service as any, 'detectSteamGuardState').mockResolvedValue('NoSGInput');

    const result = await service.login(mockPage, 'testUser', 'password');
    expect(result).toBe(true);
  });
});
