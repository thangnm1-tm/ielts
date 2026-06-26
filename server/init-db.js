/* ==========================================================================
   DATABASE BOOTSTRAPPER (Auto DB & Tables Initializer)
   ========================================================================== */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  password: '123456',
  port: 5432
};

async function initDatabase() {
  console.log("1. Connecting to default 'postgres' database to check target schema...");
  const bootClient = new Client({ ...dbConfig, database: 'postgres' });
  
  try {
    await bootClient.connect();
    
    // Check if database 'ielts_hub' already exists
    const checkDbRes = await bootClient.query("SELECT 1 FROM pg_database WHERE datname='ielts_hub'");
    if (checkDbRes.rows.length === 0) {
      await bootClient.query("CREATE DATABASE ielts_hub");
      console.log("→ Database 'ielts_hub' created successfully!");
    } else {
      console.log("→ Database 'ielts_hub' already exists.");
    }
  } catch (err) {
    console.error("Error checking/creating database:", err.message);
  } finally {
    await bootClient.end();
  }

  console.log("2. Connecting to 'ielts_hub' to initialize table structures...");
  const dbClient = new Client({ ...dbConfig, database: 'ielts_hub' });
  
  try {
    await dbClient.connect();
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sqlScript = fs.readFileSync(schemaPath, 'utf8');
    
    console.log("Executing SQL schema script...");
    await dbClient.query(sqlScript);
    console.log("→ Database structures and relationships initialized successfully!");
  } catch (err) {
    console.error("Error executing schema script:", err.message);
  } finally {
    await dbClient.end();
  }
}

initDatabase();
