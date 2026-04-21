import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const createDb = async () => {
    // Connect to the default database "neondb"
    const connectionString = "postgresql://neondb_owner:npg_Vl5MuLmhe1Ug@ep-plain-wildflower-amhzwmea-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";
    
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log("Connected to neondb.");
        await client.query("CREATE DATABASE kinder;");
        console.log("Database 'kinder' created successfully.");
    } catch (e: any) {
        if (e.code === '42P04') {
            console.log("Database 'kinder' already exists.");
        } else {
            console.error("Error creating db:", e);
        }
    } finally {
        await client.end();
    }
};

createDb();
