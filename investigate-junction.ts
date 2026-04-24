import "reflect-metadata";
import { AppDataSource } from "./src/config/data-source";

async function investigate() {
  try {
    AppDataSource.setOptions({ synchronize: false });
    await AppDataSource.initialize();
    
    console.log("--- Junction Table Columns ---");
    const columns = await AppDataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'student_classrooms'
    `);
    console.log(columns);

    console.log("--- Junction Table Constraints ---");
    const constraints = await AppDataSource.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'student_classrooms'::regclass
    `);
    console.log(constraints);

    console.log("--- Sample Data ---");
    const data = await AppDataSource.query(`
      SELECT * FROM student_classrooms LIMIT 5
    `);
    console.log(data);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

investigate();
