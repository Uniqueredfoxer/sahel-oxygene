import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

async function applyMigration() {
  console.log('🚀 Starting Supabase Migration...\n');

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.DB_URL ||
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'postgres'}`;

  const client = new Client({
    connectionString,
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  });

  try {
    console.log(`📡 Connecting to Supabase (${process.env.DB_HOST || 'via connection string'})...`);
    await client.connect();
    console.log('✅ Connected successfully to Supabase PostgreSQL!\n');

    const migrationFile = path.join(__dirname, '../supabase/migrations/001_init_schema.sql');
    console.log(`📄 Reading migration file: ${migrationFile}`);
    let sql = fs.readFileSync(migrationFile, 'utf8');

    // Make type creation idempotent
    sql = sql
      .replace(
        "CREATE TYPE user_role_enum AS ENUM ('administrateur', 'gestionnaire', 'livreur', 'vendeur_gaz');",
        `DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
            CREATE TYPE user_role_enum AS ENUM ('administrateur', 'gestionnaire', 'livreur', 'vendeur_gaz');
          END IF;
        END $$;`
      )
      .replace(
        "CREATE TYPE livraison_statut_enum AS ENUM ('en_attente', 'en_cours', 'livree', 'annulee');",
        `DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'livraison_statut_enum') THEN
            CREATE TYPE livraison_statut_enum AS ENUM ('en_attente', 'en_cours', 'livree', 'annulee');
          END IF;
        END $$;`
      );

    // Make table creation idempotent
    sql = sql.replace(/CREATE TABLE /g, 'CREATE TABLE IF NOT EXISTS ');
    // Make index creation idempotent
    sql = sql.replace(/CREATE INDEX /g, 'CREATE INDEX IF NOT EXISTS ');

    console.log('⚡ Executing schema migration...');
    await client.query(sql);
    console.log('✅ Schema migration executed successfully!\n');

    // Verification
    console.log('🔍 Verifying created tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log(`✅ Found ${result.rows.length} public tables in Supabase:`);
    result.rows.forEach((r, idx) => console.log(`   ${idx + 1}. ${r.table_name}`));

    await client.end();
    console.log('\n🎉 Migration to Supabase finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (client) {
      try { await client.end(); } catch (_) {}
    }
    process.exit(1);
  }
}

applyMigration();
