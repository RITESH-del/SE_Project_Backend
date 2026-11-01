import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../config/env.js';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../../shared/errors/AppError.js';
class AuthService {
  constructor(authRepository, jwtSecret = config.JWT_SECRET, jwtExpiresIn = config.JWT_EXPIRES_IN) {
    this.authRepository = authRepository;
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
    this.saltRounds = 10;
  }

  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );
  }

  formatUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async register({ name, email, password, role = 'student' }) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await this.authRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    const createdUser = await this.authRepository.createUser({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    const user = this.formatUser(createdUser);
    const token = this.generateToken(user);

    return { user, token };
  }

  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await this.authRepository.findByEmail(normalizedEmail);
    if (!existingUser) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const user = this.formatUser(existingUser);
    const token = this.generateToken(user);

    return { user, token };
  }

  async getMe(userId) {
    const existingUser = await this.authRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    return { user: this.formatUser(existingUser) };
  }
}

export { AuthService };
export default AuthService;
