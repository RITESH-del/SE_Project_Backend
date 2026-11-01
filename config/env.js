import dotenv from 'dotenv';
dotenv.config();

const config = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_key_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
};

export const {
  PORT,
  NODE_ENV,
  CLIENT_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  DATABASE_URL,
} = config;

export default config;
