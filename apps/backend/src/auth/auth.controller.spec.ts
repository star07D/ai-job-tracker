import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    login: jest.fn(),
    register: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('delegates login to AuthService with the credentials', async () => {
    authService.login.mockResolvedValue({ token: 't' });
    await controller.login({ email: 'a@example.com', password: 'pw' });
    expect(authService.login).toHaveBeenCalledWith('a@example.com', 'pw');
  });

  it('delegates register to AuthService with the DTO', async () => {
    const dto = { email: 'a@example.com', password: 'password123' };
    authService.register.mockResolvedValue({ token: 't' });
    await controller.register(dto);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });
});
