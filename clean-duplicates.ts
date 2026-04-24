import "reflect-metadata";
import { AppDataSource } from "./src/config/data-source";

async function clean() {
  try {
    // Modify options to disable synchronize so we can connect despite the error
    AppDataSource.setOptions({ synchronize: false });
    await AppDataSource.initialize();
    console.log("Connected (Sync Disabled). Cleaning up duplicates in student_classrooms...");

    // Find duplicates
    const duplicates = await AppDataSource.query(`
      SELECT student_id, classroom_id, COUNT(*)
      FROM student_classrooms
      GROUP BY student_id, classroom_id
      HAVING COUNT(*) > 1
    `);
    console.log("Found duplicates:", duplicates);

    if (duplicates.length > 0) {
      // Remove duplicates keeping one (PostgreSQL doesn't have a built-in 'rowid' like Oracle, but we can use ctid)
      await AppDataSource.query(`
        DELETE FROM student_classrooms a USING (
          SELECT MIN(ctid) as min_ctid, student_id, classroom_id
          FROM student_classrooms
          GROUP BY student_id, classroom_id
          HAVING COUNT(*) > 1
        ) b
        WHERE a.student_id = b.student_id 
        AND a.classroom_id = b.classroom_id 
        AND a.ctid <> b.min_ctid
      `);
      console.log("Duplicates removed.");
    } else {
      console.log("No duplicates found.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
}

clean();
