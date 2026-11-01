import { jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import AuthService from '../auth.service.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../../shared/errors/AppError.js';

describe('AuthService', () => {
  let authRepository;
  let authService;

  beforeEach(() => {
    authRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      createUser: jest.fn(),
    };
    authService = new AuthService(authRepository, 'test_jwt_secret', '1h');
  });

  describe('register', () => {
    it('throws ConflictError if email already exists', async () => {
      authRepository.findByEmail.mockResolvedValue({ id: '1', email: 'test@example.com' });

      await expect(
        authService.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('hashes password, creates user, and returns user and token', async () => {
      authRepository.findByEmail.mockResolvedValue(null);
      authRepository.createUser.mockImplementation(async (userData) => ({
        id: 'user-uuid-1',
        name: userData.name,
        email: userData.email,
        role: userData.role,
        createdAt: new Date(),
      }));

      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'faculty',
      });

      expect(authRepository.createUser).toHaveBeenCalled();
      expect(result).toHaveProperty('token');
      expect(result.user).toMatchObject({
        id: 'user-uuid-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'faculty',
      });
    });
  });

  describe('login', () => {
    it('throws UnauthorizedError if user is not found', async () => {
      authRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'notfound@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError if password is wrong', async () => {

      const hashedPassword = await bcrypt.hash('correct_password', 10);
      authRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'student',
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong_password',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('returns user and token when credentials are valid', async () => {

      const hashedPassword = await bcrypt.hash('correct_password', 10);
      authRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'admin',
        createdAt: new Date(),
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'correct_password',
      });

      expect(result.user).toMatchObject({
        id: 'user-1',
        email: 'test@example.com',
        role: 'admin',
      });
      expect(typeof result.token).toBe('string');
    });
  });

  describe('getMe', () => {
    it('throws NotFoundError if user does not exist', async () => {
      authRepository.findById.mockResolvedValue(null);

      await expect(authService.getMe('non-existent-id')).rejects.toThrow(NotFoundError);
    });

    it('returns formatted user profile', async () => {
      authRepository.findById.mockResolvedValue({
        id: 'user-1',
        name: 'Admin User',
        email: 'admin@campus.edu',
        role: 'admin',
        createdAt: new Date(),
      });

      const result = await authService.getMe('user-1');
      expect(result.user).toMatchObject({
        id: 'user-1',
        email: 'admin@campus.edu',
        name: 'Admin User',
        role: 'admin',
      });
    });
  });
});
