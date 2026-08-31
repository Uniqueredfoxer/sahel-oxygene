import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

/**
 * Database Configuration
 * Supports local PostgreSQL, Neon Serverless Postgres, and Supabase
 * 
 * DATABASE_URL format: postgresql://user:password@host:5432/dbname?sslmode=require
 */

const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;
const host = process.env.DB_HOST || '';
const isCloudDb = dbUrl?.includes('neon.tech') || dbUrl?.includes('supabase.') || host.includes('neon.tech') || host.includes('supabase.');
const useSsl = process.env.NODE_ENV === 'production' || isCloudDb || process.env.DB_SSL === 'true';

const sequelizeOptions = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  ...(useSsl && {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }),
};

const sequelize = dbUrl
  ? new Sequelize(dbUrl, sequelizeOptions)
  : new Sequelize(
      process.env.DB_NAME || 'postgres',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        ...sequelizeOptions,
      }
    );

export default sequelize;
