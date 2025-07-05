require('dotenv/config');
const { drizzle } = require('drizzle-orm/neon-http');

const db = drizzle(process.env.DATABASE_URL);

async function verifySchema() {
  try {
    console.log('Checking database schema...');
    
    // Get table structure
    const columns = await db.execute(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Users table structure:');
    console.log('==========================');
    columns.rows.forEach(col => {
      console.log(`${col.column_name.padEnd(25)} | ${col.data_type.padEnd(15)} | ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Get sample data
    const users = await db.execute('SELECT id, "clerkId", "firstName", "lastName", name, email FROM users LIMIT 3;');
    
    console.log('\n👥 Sample user data:');
    console.log('====================');
    users.rows.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`  ClerkID: ${user.clerkId || 'N/A'}`);
      console.log(`  FirstName: ${user.firstName || 'N/A'}`);
      console.log(`  LastName: ${user.lastName || 'N/A'}`);
      console.log(`  FullName: ${user.name || 'N/A'}`);
      console.log(`  Email: ${user.email || 'N/A'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error verifying schema:', error);
  }
}

verifySchema(); 