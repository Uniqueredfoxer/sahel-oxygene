# Supabase Migration Guide - SAHEL OXYGENE

This guide walks you through migrating the SAHEL OXYGENE backend database to Supabase.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Create Supabase Project](#step-1-create-supabase-project)
3. [Step 2: Prepare Current Database](#step-2-prepare-current-database)
4. [Step 3: Apply Schema to Supabase](#step-3-apply-schema-to-supabase)
5. [Step 4: Migrate Data (Optional)](#step-4-migrate-data-optional)
6. [Step 5: Update Backend Configuration](#step-5-update-backend-configuration)
7. [Step 6: Test Connection](#step-6-test-connection)
8. [Step 7: Deploy](#step-7-deploy)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Supabase account (create at https://supabase.com)
- Node.js and npm installed
- Access to your current database (if migrating data)
- Git installed

---

## Step 1: Create Supabase Project

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Sign in to your account

2. **Create a new project**
   - Click "New project"
   - Enter project details:
     - **Name**: `sahel-oxygene`
     - **Database password**: Create a strong password (save this!)
     - **Region**: Choose closest to your users (e.g., `Europe (Frankfurt)` for Africa)
   - Click "Create new project"

3. **Wait for project setup** (5-10 minutes)

4. **Get connection credentials**
   - Go to Settings → Database → Connection Pooling
   - Copy the connection string for your preferred client
   - You'll also find these in Settings → Database → Connection string:
     - `Host`: `db.[PROJECT_ID].supabase.co`
     - `Database`: `postgres`
     - `User`: `postgres`
     - `Password`: (the one you set)
     - `Port`: `5432`

---

## Step 2: Prepare Current Database

### If you have existing data to migrate:

1. **Export current database**
   ```bash
   # Backup your current PostgreSQL database
   pg_dump -U postgres -d sahel_oxygene -F c -b -v -f sahel_oxygene_backup.dump
   ```

2. **Export schema only**
   ```bash
   # If you want schema without data
   pg_dump -U postgres -d sahel_oxygene --schema-only -f sahel_oxygene_schema.sql
   ```

### If starting fresh:
Skip this step and continue to Step 3.

---

## Step 3: Apply Schema to Supabase

### Option A: Using Supabase SQL Editor (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

2. **Copy & paste the migration SQL**
   - Open `backend/supabase/migrations/001_init_schema.sql`
   - Copy all content
   - Paste into the SQL editor
   - Click "Run" button

3. **Verify tables were created**
   - Go to "Database" → "Tables"
   - You should see all tables listed:
     - `profiles`
     - `user_roles`
     - `gas_vendors`
     - `livraisons`
     - `gps_positions`
     - `action_logs`
     - `admin_whatsapp`
     - `settings`

### Option B: Using psql command line

1. **Connect to Supabase database**
   ```bash
   psql -h db.[PROJECT_ID].supabase.co -U postgres -d postgres -p 5432
   ```

2. **When prompted, enter your Supabase database password**

3. **Run the migration**
   ```bash
   \i backend/supabase/migrations/001_init_schema.sql
   ```

4. **Exit psql**
   ```bash
   \q
   ```

---

## Step 4: Migrate Data (Optional)

### If you have existing data in local database:

1. **Export data from local database**
   ```bash
   # Export all data
   pg_dump -U postgres -d sahel_oxygene --data-only --disable-triggers > data_backup.sql
   ```

2. **Import to Supabase**
   ```bash
   psql -h db.[PROJECT_ID].supabase.co -U postgres -d postgres -p 5432 < data_backup.sql
   ```

3. **Fix sequence values**
   ```bash
   # If using auto-incrementing IDs
   psql -h db.[PROJECT_ID].supabase.co -U postgres -d postgres -p 5432 -c "
   SELECT setval(pg_get_serial_sequence(tablename, 'id'), 
                 (SELECT MAX(id) FROM tablename)) 
   FROM pg_tables WHERE tablename NOT LIKE 'pg_%';
   "
   ```

**Note**: For UUID-based tables, this isn't needed.

---

## Step 5: Update Backend Configuration

### Update environment variables

1. **Copy .env.example to .env**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit .env and add Supabase credentials**
   ```env
   # Database Configuration - Supabase
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
   DB_HOST=db.[PROJECT_ID].supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your-supabase-database-password
   
   # Other existing configuration
   JWT_SECRET=your-existing-jwt-secret
   PORT=5000
   NODE_ENV=production
   # ... other variables
   ```

3. **Example with actual values:**
   ```env
   DATABASE_URL=postgresql://postgres:MyP@ssw0rd123@db.abc123xyz.supabase.co:5432/postgres
   DB_HOST=db.abc123xyz.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=MyP@ssw0rd123
   ```

### Verify .env file is in .gitignore
```bash
# Make sure .env is NOT committed to Git
echo ".env" >> .gitignore
```

---

## Step 6: Test Connection

### Test from Node.js

1. **Create test script**
   ```bash
   cat > backend/test-db.js << 'EOF'
   import dotenv from 'dotenv';
   import { Sequelize } from 'sequelize';

   dotenv.config();

   const sequelize = new Sequelize(
     process.env.DB_NAME,
     process.env.DB_USER,
     process.env.DB_PASSWORD,
     {
       host: process.env.DB_HOST,
       port: process.env.DB_PORT,
       dialect: 'postgres',
       dialectOptions: {
         ssl: {
           require: true,
           rejectUnauthorized: false,
         },
       },
     }
   );

   (async () => {
     try {
       await sequelize.authenticate();
       console.log('✅ Connection successful!');
       
       const tables = await sequelize.queryInterface.showAllTables();
       console.log('📋 Available tables:', tables);
       
       process.exit(0);
     } catch (error) {
       console.error('❌ Connection failed:', error);
       process.exit(1);
     }
   })();
   EOF
   ```

2. **Run test**
   ```bash
   node test-db.js
   ```

3. **Expected output**
   ```
   ✅ Connection successful!
   📋 Available tables: [
     'profiles',
     'user_roles',
     'gas_vendors',
     'livraisons',
     'gps_positions',
     'action_logs',
     'admin_whatsapp',
     'settings'
   ]
   ```

### Test from backend server

1. **Start backend**
   ```bash
   npm run dev
   ```

2. **Check logs for database connection**
   ```
   Server running on port 5000
   Database connected successfully
   ```

---

## Step 7: Deploy

### Update render.yaml or deployment config

If using Render or other deployment platform:

1. **Update environment variables in deployment platform**
   - Go to your deployment project settings
   - Add these environment variables:
     ```
     DB_HOST=db.[PROJECT_ID].supabase.co
     DB_PORT=5432
     DB_NAME=postgres
     DB_USER=postgres
     DB_PASSWORD=<supabase-password>
     ```

2. **Redeploy your application**
   ```bash
   git push  # Triggers auto-deploy if configured
   ```

### For Vercel (if used for frontend):

Frontend automatically works with Supabase if API calls are updated.

---

## Troubleshooting

### "Connection refused" error

**Cause**: Can't reach Supabase server

**Solutions**:
1. Verify host/port are correct
2. Check Supabase project is running (not paused)
3. Ensure database password is correct
4. Check IP whitelist (Supabase allows all by default)

### "FATAL: password authentication failed"

**Cause**: Wrong database password

**Solution**:
- Reset password in Supabase Dashboard → Settings → Database → Password
- Don't forget to update .env file

### "Relation 'profiles' does not exist"

**Cause**: Schema wasn't applied

**Solution**:
1. Go to Supabase → SQL Editor
2. Re-run the migration file
3. Verify in "Database" → "Tables"

### Connection pool timeout

**Cause**: Too many connections

**Solution**: Connection pooling is already configured in `db.js`

### SSL/TLS connection errors

**Cause**: SSL configuration mismatch

**Solution**: Already handled in updated `db.js` for production

---

## Post-Migration Checklist

- [ ] Database tables created in Supabase
- [ ] Schema verified in Supabase Dashboard
- [ ] Environment variables updated in .env
- [ ] .env file is in .gitignore
- [ ] Test connection successful
- [ ] Backend server starts without errors
- [ ] API endpoints working with new database
- [ ] Frontend can query data
- [ ] Backup of old database created
- [ ] Row Level Security (RLS) policies configured (if needed)
- [ ] Monitoring set up in Supabase

---

## Next Steps

### Enable additional Supabase features:

1. **Authentication (optional)**
   - Use Supabase Auth instead of manual JWT
   - Update authentication routes

2. **Row Level Security (RLS)**
   - Configure RLS policies for data access control
   - Currently RLS is enabled but policies need to be configured

3. **Edge Functions**
   - Migrate any serverless functions to Supabase Edge Functions

4. **Real-time Subscriptions**
   - Use Supabase Realtime for live data (if needed)

---

## Support

For Supabase issues:
- Documentation: https://supabase.com/docs
- Community: https://discord.supabase.io
- GitHub Issues: https://github.com/supabase/supabase/issues

