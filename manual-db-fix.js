const { Client } = require('pg');
require('dotenv').config();

async function fix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to DB.");

    console.log("Dropping table 'student_classrooms'...");
    await client.query("DROP TABLE IF EXISTS student_classrooms CASCADE");
    
    console.log("Creating table 'student_classrooms' manually with correct Primary Key...");
    await client.query(`
      CREATE TABLE student_classrooms (
        student_id uuid NOT NULL,
        classroom_id uuid NOT NULL,
        CONSTRAINT "PK_student_classrooms" PRIMARY KEY (student_id, classroom_id),
        CONSTRAINT "FK_student" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        CONSTRAINT "FK_classroom" FOREIGN KEY (classroom_id) REFERENCES class_rooms(id) ON DELETE CASCADE
      )
    `);

    console.log("✓ Done.");
    await client.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
