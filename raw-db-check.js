const { Client } = require('pg');
require('dotenv').config();

async function test() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to DB.");

    // Check if table exists
    const tableCheck = await client.query("SELECT * FROM information_schema.tables WHERE table_name = 'student_classrooms'");
    if (tableCheck.rows.length === 0) {
      console.log("Table 'student_classrooms' DOES NOT EXIST.");
    } else {
      console.log("Table exists. Checking data...");
      const data = await client.query("SELECT student_id, COUNT(*) FROM student_classrooms GROUP BY student_id HAVING COUNT(*) > 1");
      console.log("Duplicate student_ids:", data.rows);
      
      const allData = await client.query("SELECT * FROM student_classrooms");
      console.log("Total rows:", allData.rows.length);
      console.log("Sample rows:", allData.rows.slice(0, 5));
    }

    await client.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
