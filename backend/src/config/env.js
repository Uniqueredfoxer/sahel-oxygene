/**
 * Environment variable validation and configuration
 */

export function validateEnv() {
  const hasDbUrl = Boolean(process.env.DATABASE_URL || process.env.DB_URL);
  const required = ['JWT_SECRET', ...(hasDbUrl ? [] : ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'])];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Check .env file or set them in your environment.`
    );
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET is less than 32 characters. Use a stronger secret in production.');
  }

  return {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
      .split(',')
      .map((o) => o.trim()),
    dbUrl: process.env.DATABASE_URL || process.env.DB_URL,
    dbHost: process.env.DB_HOST,
    dbPort: parseInt(process.env.DB_PORT || '5432', 10),
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    dbName: process.env.DB_NAME,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5', 10),
  };
}

export default validateEnv;
