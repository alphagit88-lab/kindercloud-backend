import { AppDataSource } from "../config/data-source";

const syncDatabase = async () => {
  try {
    console.log("Connecting to the database to synchronize Schema...");
    // Initialize connection
    await AppDataSource.initialize();
    console.log("Data Source has been initialized.");

    // Sync schema (dropBeforeSync = true to ensure a clean slate, wait, maybe just sync to avoid dropping?)
    // But since it's a new db, dropBeforeSync=false is fine. We just want to create new tables.
    console.log("Synchronizing schema...");
    await AppDataSource.synchronize(false);
    console.log("Schema synchronization complete.");

    process.exit(0);
  } catch (error) {
    console.error("Error during database synchronization:", error);
    process.exit(1);
  }
};

syncDatabase();
