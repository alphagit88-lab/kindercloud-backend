import "reflect-metadata";
import { AppDataSource } from "../config/data-source";
import { ClassRoom } from "../entities/ClassRoom";

async function checkDB() {
    try {
        await AppDataSource.initialize();
        const repo = AppDataSource.getRepository(ClassRoom);
        const count = await repo.count();
        console.log(`Found ${count} classrooms.`);
        const classrooms = await repo.find();
        console.log(JSON.stringify(classrooms, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkDB();
