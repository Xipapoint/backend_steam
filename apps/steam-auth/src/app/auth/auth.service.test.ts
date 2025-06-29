import { SteamAuthService } from './auth.service';

jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    Repository: jest.fn(),
  }
  
});
jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common');
  return {
    ...actual,
    Injectable: () => (target?: any) => target,
    Logger: jest.fn().mockImplementation(() => ({
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
    })),

  }
});

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => (target?: any, key?: string | symbol) => target,
}));

const mockUserRepository = {
  save: jest.fn(),
};

describe('SteamAuthService (without puppeteer)', () => {
  let service: SteamAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SteamAuthService(mockUserRepository as any);
  });

  describe('loginWithAcception', () => {
    it('should throw error on failure', async () => {
      (service as any).pageNavigation = jest.fn().mockRejectedValue(new Error('fail'));
      await expect(service.loginWithAcception({} as any, 'user', 'pass')).rejects.toThrow('fail');
    });
  });
});
