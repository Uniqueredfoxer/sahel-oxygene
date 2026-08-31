# Supabase Quick Reference

## Get Your Supabase Credentials

### Step 1: Your Project ID
Your project ID is: `regfwtlbxgrolbpaopks`
- Dashboard URL: https://supabase.com/dashboard/project/regfwtlbxgrolbpaopks

### Step 2: Connection String Reference
```
# Direct Connection (IPv6 / Production servers like Render, Fly.io, Railway)
postgresql://postgres:[YOUR-PASSWORD]@db.regfwtlbxgrolbpaopks.supabase.co:5432/postgres

# Connection Pooling (IPv4 compatible / local development / serverless)
postgresql://postgres.regfwtlbxgrolbpaopks:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

### Step 3: Backend .env Configuration
```env
# Option A: Full Connection URL
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.regfwtlbxgrolbpaopks.supabase.co:5432/postgres

# Option B: Individual Variables
DB_HOST=db.regfwtlbxgrolbpaopks.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[YOUR-PASSWORD]
DB_SSL=true
```

## Complete Connection String Reference

```
Host:     db.[PROJECT_ID].supabase.co
Port:     5432
Database: postgres
User:     postgres
Password: [your-password]
```

## Useful Supabase Dashboard Links

- **SQL Editor**: Write and run SQL queries
- **Table Editor**: Browse tables and data
- **Database Settings**: Connection info, backups
- **Authentication** (optional): Set up Supabase Auth

## SSL/TLS for Supabase

Supabase requires SSL connections in production. The backend config (`db.js`) already handles this.

## Common Database Operations

### Create a new admin user
```sql
INSERT INTO profiles (name, email, password_hash, phone, active) 
VALUES ('Admin', 'admin@example.com', '[hashed-password]', '+223XXXXXXXX', true);

INSERT INTO user_roles (user_id, role) 
VALUES ((SELECT id FROM profiles WHERE email = 'admin@example.com'), 'administrateur');
```

### Check existing tables
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';
```

### View all users
```sql
SELECT id, name, email, active FROM profiles;
```

### Delete a user (careful!)
```sql
DELETE FROM profiles WHERE id = '[user-id]';
```

## Backup & Restore

### Backup database
```bash
pg_dump -h db.abc123xyz.supabase.co -U postgres -d postgres > backup.sql
```

### Restore from backup
```bash
psql -h db.abc123xyz.supabase.co -U postgres -d postgres < backup.sql
```

## Testing Connection

```bash
# Test from backend folder
npm run test:db
```

## Row Level Security (RLS)

RLS is enabled on sensitive tables but needs policies configured:
- `profiles`
- `user_roles`
- `livraisons`
- `gps_positions`
- `action_logs`

Currently unauthenticated queries will fail. Configure RLS policies based on your auth method.

## Enable Supabase Auth (Optional)

1. Go to **Authentication** in your project
2. Enable **Email** provider
3. Update backend to use Supabase Auth instead of manual JWT

## Support Resources

- Supabase Docs: https://supabase.com/docs
- Database Setup: https://supabase.com/docs/guides/database/setup
- Connection Pooling: https://supabase.com/docs/guides/database/connecting-to-postgres
- PostgreSQL Docs: https://www.postgresql.org/docs/
