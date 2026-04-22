import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";

const seedDatabase = async () => {
  try {
    console.log("Connecting to the database for seeding...");
    await AppDataSource.initialize();
    console.log("Data Source initialized.");

    const userRepository = AppDataSource.getRepository(User);
    const saltRounds = 10;
    const defaultPassword = await bcrypt.hash("Kinder@123!", saltRounds);

    const usersToSeed = [
      {
        email: "admin@kindercloud.com",
        firstName: "System",
        lastName: "Admin",
        role: "admin",
      },
      {
        email: "teacher@kindercloud.com",
        firstName: "Sarah",
        lastName: "Jenkins",
        role: "teacher",
      },
      {
        email: "parent@kindercloud.com",
        firstName: "Michael",
        lastName: "Parent",
        role: "parent",
      },
      {
        email: "kid@kindercloud.com",
        firstName: "Little",
        lastName: "Timmy",
        role: "kid",
      }
    ];

    for (const userData of usersToSeed) {
      const exists = await userRepository.findOne({
        where: { email: userData.email },
      });

      if (!exists) {
        console.log(`Creating ${userData.role} user: ${userData.email}...`);
        const user = userRepository.create({
          ...userData,
          password: defaultPassword,
          status: "active",
          isActive: true,
          emailVerified: true,
        });
        await userRepository.save(user);
      } else {
        console.log(`${userData.role} user already exists: ${userData.email}`);
      }
    }

    console.log("Seeding complete. Use pass: Kinder@123! for all demo accounts.");
    process.exit(0);
  } catch (error) {
    console.error("Error during database seeding:", error);
    process.exit(1);
  }
};

seedDatabase();
