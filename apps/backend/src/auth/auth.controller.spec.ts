import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
// @nestjs/config@12 ships ESM-only; Jest's CJS transform can't parse its dist
// file directly. A minimal stub is all DI needs to wire the token by identity.
jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from './auth.constants';

function mockResponse() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
  } as any;
}

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    login: jest.fn(),
    register: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    loginWithGoogle: jest.fn(),
  };
  let configValues: Record<string, string | undefined>;

  beforeEach(async () => {
    jest.clearAllMocks();
    configValues = {};
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => configValues[key]) },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('login delegates to AuthService, sets the refresh cookie, and never returns it in the body', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: 'u1' },
    });
    const res = mockResponse();

    const result = await controller.login(
      { email: 'a@example.com', password: 'pw' },
      res,
    );

    expect(authService.login).toHaveBeenCalledWith('a@example.com', 'pw');
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_COOKIE_NAME,
      'r',
      expect.objectContaining({
        httpOnly: true,
        path: REFRESH_COOKIE_PATH,
      }),
    );
    expect(result).toEqual({ accessToken: 'a', user: { id: 'u1' } });
    expect(result).not.toHaveProperty('refreshToken');
  });

  it('register delegates to AuthService and sets the refresh cookie', async () => {
    authService.register.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: 'u1' },
    });
    const res = mockResponse();
    const dto = { email: 'a@example.com', password: 'password123' };

    await controller.register(dto, res);

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(res.cookie).toHaveBeenCalled();
  });

  describe('refresh', () => {
    it('reads the cookie, rotates it, and returns the new access token', async () => {
      authService.refresh.mockResolvedValue({
        accessToken: 'a2',
        refreshToken: 'r2',
        user: { id: 'u1' },
      });
      const res = mockResponse();

      const result = await controller.refresh(
        { cookies: { [REFRESH_COOKIE_NAME]: 'r1' } } as any,
        res,
      );

      expect(authService.refresh).toHaveBeenCalledWith('r1');
      expect(res.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        'r2',
        expect.anything(),
      );
      expect(result).toEqual({ accessToken: 'a2', user: { id: 'u1' } });
    });

    it('401s when there is no refresh cookie at all', async () => {
      await expect(
        controller.refresh({ cookies: {} } as any, mockResponse()),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(authService.refresh).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('revokes the cookie token and clears the cookie', async () => {
      const res = mockResponse();

      const result = await controller.logout(
        { cookies: { [REFRESH_COOKIE_NAME]: 'r1' } } as any,
        res,
      );

      expect(authService.logout).toHaveBeenCalledWith('r1');
      expect(res.clearCookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        expect.objectContaining({ path: REFRESH_COOKIE_PATH }),
      );
      expect(result).toEqual({ success: true });
    });

    it('still clears the cookie and succeeds when there was none', async () => {
      const res = mockResponse();

      const result = await controller.logout({ cookies: {} } as any, res);

      expect(authService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('getConfig', () => {
    it('reports Google enabled once both credentials are set', () => {
      configValues.GOOGLE_CLIENT_ID = 'id';
      configValues.GOOGLE_CLIENT_SECRET = 'secret';
      expect(controller.getConfig()).toEqual({ googleEnabled: true });
    });

    it('reports Google disabled when either credential is missing', () => {
      configValues.GOOGLE_CLIENT_ID = 'id';
      expect(controller.getConfig()).toEqual({ googleEnabled: false });
    });
  });

  describe('googleCallback', () => {
    const profile = {
      email: 'a@example.com',
      firstName: 'A',
      lastName: 'B',
      googleId: 'g1',
    };

    it('logs the profile in, sets the refresh cookie, and redirects to the dashboard', async () => {
      configValues.FRONTEND_URL = 'https://app.example.com';
      authService.loginWithGoogle.mockResolvedValue({
        accessToken: 'a',
        refreshToken: 'r',
        user: { id: 'u1' },
      });
      const res = mockResponse();

      await controller.googleCallback({ user: profile } as any, res);

      expect(authService.loginWithGoogle).toHaveBeenCalledWith(profile);
      expect(res.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        'r',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(res.redirect).toHaveBeenCalledWith(
        'https://app.example.com/dashboard',
      );
    });

    it('redirects to the login page with an error when Google auth failed', async () => {
      configValues.FRONTEND_URL = 'https://app.example.com';
      const res = mockResponse();

      await controller.googleCallback({ user: undefined } as any, res);

      expect(authService.loginWithGoogle).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(
        'https://app.example.com/login?error=google',
      );
    });

    it('redirects to the login page with an error when linking the account fails', async () => {
      configValues.FRONTEND_URL = 'https://app.example.com';
      authService.loginWithGoogle.mockRejectedValue(new Error('db down'));
      const res = mockResponse();

      await controller.googleCallback({ user: profile } as any, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'https://app.example.com/login?error=google',
      );
    });
  });
});
