import { SteamAuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities';
import { Test, TestingModule } from '@nestjs/testing';

describe('SteamAuthService (unit)', () => {
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

  it('checkSelector should return true if selector found', async () => {
    mockPage.waitForSelector.mockResolvedValue(true);
    const result = await service['checkSelector'](mockPage, '.test', 'Test selector');
    expect(result).toBe(true);
  });

  it('checkSelector should return false if selector not found', async () => {
    mockPage.waitForSelector.mockRejectedValue(new Error('Not found'));
    const result = await service['checkSelector'](mockPage, '.test', 'Test selector');
    expect(result).toBe(false);
  });

  it('_executePuppeteerActionWithPause should resolve if action succeeds', async () => {
    const actionMock = jest.fn().mockResolvedValue('ok');
    mockPage.$.mockResolvedValue(null);
    const result = await service['_executePuppeteerActionWithPause'](actionMock, mockPage, 'TestAction');
    expect(result).toBe('ok');
    expect(actionMock).toHaveBeenCalled();
  });

  it('isSteamGuardSelectorExists should return "SGInput" if selector found', async () => {
    jest.spyOn(service as any, 'checkSelector').mockResolvedValue(true);
    const result = await service['isSteamGuardSelectorExists'](mockPage);
    expect(result).toBe('SGInput');
  });

  it('isSteamGuardSelectorExists should return "NoSGInput" if selector not found', async () => {
    jest.spyOn(service as any, 'checkSelector').mockResolvedValue(false);
    const result = await service['isSteamGuardSelectorExists'](mockPage);
    expect(result).toBe('NoSGInput');
  });
});
