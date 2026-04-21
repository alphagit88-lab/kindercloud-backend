import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";

const seedDatabase = async () => {
  try {
    console.log("Connecting to the database for seeding...");
    await AppDataSource.initialize();
    console.log("Data Source initialized.");

    const userRepository = AppDataSource.getRepository(User);

    // Check if an admin already exists
    const adminExists = await userRepository.findOne({
      where: { email: "admin@kindercloud.com" },
    });

    if (adminExists) {
      console.log("Admin user already exists. Skipping seed.");
    } else {
      console.log("Creating default ADMIN user...");

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash("Kinder@123!", saltRounds);

      const adminUser = userRepository.create({
        email: "admin@kindercloud.com",
        password: hashedPassword,
        firstName: "System",
        lastName: "Admin",
        role: "admin",
        status: "active",
        isActive: true,
        emailVerified: true,
      });

      await userRepository.save(adminUser);
      console.log("Default ADMIN user created successfully.");
      console.log("Email: admin@kindercloud.com");
      console.log("Password: Kinder@123!");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error during database seeding:", error);
    process.exit(1);
  }
};

seedDatabase();
