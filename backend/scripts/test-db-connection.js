import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

console.log('🔍 Testing Supabase/PostgreSQL Database Connection...\n');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'postgres',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: false,
    ...(process.env.NODE_ENV === 'production' && {
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    }),
  }
);

(async () => {
  try {
    console.log('📝 Connection Details:');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Port: ${process.env.DB_PORT || 5432}`);
    console.log(`   Database: ${process.env.DB_NAME || 'postgres'}`);
    console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
    console.log();

    console.log('⏳ Attempting connection...');
    await sequelize.authenticate();
    console.log('✅ Connection successful!\n');

    console.log('📋 Fetching database information...');
    const tables = await sequelize.queryInterface.showAllTables();
    console.log(`✅ Found ${tables.length} tables:\n`);
    
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table}`);
    });

    console.log('\n📊 Table Details:');
    for (const table of tables) {
      const columns = await sequelize.queryInterface.describeTable(table);
      console.log(`\n   ${table}:`);
      Object.entries(columns).forEach(([colName, colInfo]) => {
        console.log(`      - ${colName}: ${colInfo.type}`);
      });
    }

    console.log('\n✅ Database verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed!\n');
    console.error('Error Details:');
    console.error(`   ${error.message}\n`);
    
    if (error.message.includes('password authentication failed')) {
      console.error('💡 Hint: Check your DB_PASSWORD in .env file\n');
    } else if (error.message.includes('connect ECONNREFUSED')) {
      console.error('💡 Hint: Check DB_HOST and DB_PORT in .env file\n');
    } else if (error.message.includes('database does not exist')) {
      console.error('💡 Hint: Check DB_NAME in .env file\n');
    }
    
    console.error('Troubleshooting Tips:');
    console.error('1. Verify all database credentials in .env file');
    console.error('2. For Supabase: Check connection string in dashboard');
    console.error('3. Ensure database server is running');
    console.error('4. Check firewall/network connectivity\n');
    
    process.exit(1);
  }
})();
