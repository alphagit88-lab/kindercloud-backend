import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Register a new user and auto-create role-specific profile
   */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const role = data.role || "kid";

    try {
      // Create user
      const user = this.userRepository.create({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role,
        isActive: true,
        emailVerified: true, // Auto-verify new users for now
      });

      const savedUser = await this.userRepository.save(user);

      // Return user without password
      const { password, ...userWithoutPassword } = savedUser;
      return userWithoutPassword;
    } catch (error: any) {
      // Handle unique constraint violation (email already exists)
      if (error.code === "23505" || error.code === "ER_DUP_ENTRY" || error.message?.includes("unique constraint") || error.message?.includes("duplicate key")) {
        throw new Error("User with this email already exists");
      }

      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string) {
    // Find user with password field
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    // Verify password
    let isPasswordValid = false;
    try {
      // Check if password looks like a bcrypt hash (starts with $2a$, $2b$, or $2y$)
      if (!user.password || !user.password.startsWith('$2')) {
        console.warn(`User ${email} has an invalid password hash format. Reset required.`);
        // Don't throw 500, just fail login
        throw new Error("Invalid email or password"); 
      }
      
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error(`Bcrypt error for user ${email}:`, bcryptError);
      // Determine if it was the hash format error we just threw or a real bcrypt error
      if (bcryptError instanceof Error && bcryptError.message === "Invalid email or password") {
         throw bcryptError;
      }
      // If bcrypt throws (e.g. data and hash arguments required), treat as invalid credentials safely
      throw new Error("Invalid email or password");
    }

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by ID (without password)
   */
  async getUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      bio?: string;
      profilePicture?: string;
    }
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Update fields
    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.bio !== undefined) user.bio = data.bio;
    if (data.profilePicture !== undefined)
      user.profilePicture = data.profilePicture;

    await this.userRepository.save(user);

    return user;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    // Find user with password
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.id = :userId", { userId })
      .getOne();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await this.userRepository.save(user);

    return { message: "Password changed successfully" };
  }

  /**
   * Forgot password - generate reset token
   * Returns the raw token (in production, email it to the user)
   */
  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Don't reveal whether the email exists
      return { message: "If an account with that email exists, a password reset link has been generated." };
    }

    // Generate a random reset token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Hash the token before storing (so DB compromise doesn't reveal tokens)
    const hashedToken = await bcrypt.hash(rawToken, 10);

    // Set token and expiry (1 hour)
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await this.userRepository.save(user);

    // In production, send an email with the reset link
    // For now, return the token directly
    return {
      message: "If an account with that email exists, a password reset link has been generated.",
      resetToken: rawToken,
    };
  }

  /**
   * Reset password using token
   */
  async resetPassword(email: string, token: string, newPassword: string) {
    // Find the user with their reset token fields
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.passwordResetToken")
      .where("user.email = :email", { email })
      .getOne();

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    // Check if token has expired
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new Error("Invalid or expired reset token");
    }

    // Check if token exists
    if (!user.passwordResetToken) {
      throw new Error("Invalid or expired reset token");
    }

    // Verify the token against the hashed version
    const isTokenValid = await bcrypt.compare(token, user.passwordResetToken);
    if (!isTokenValid) {
      throw new Error("Invalid or expired reset token");
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear the reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await this.userRepository.save(user);

    return { message: "Password has been reset successfully" };
  }

  /**
   * Profile Switch for Parent -> Kid
   */
  async switchProfile(parentId: string, kidId: string) {
    const parent = await this.userRepository.findOne({ where: { id: parentId } });
    if (!parent || parent.role !== "parent") {
      throw new Error("Only parents can switch profiles to their kids");
    }

    // Verify link exists
    const guardianLinkRepo = AppDataSource.getRepository("GuardianLink");
    const link = await guardianLinkRepo.findOne({
      where: { parentId, kidId },
    });

    if (!link) {
      throw new Error("Cannot switch profile: This kid is not linked to your account");
    }

    // Fetch the kid
    const kid = await this.userRepository.findOne({ where: { id: kidId } });
    if (!kid) {
      throw new Error("Kid profile not found");
    }

    const { password: _, ...kidWithoutPassword } = kid;
    return kidWithoutPassword;
  }
}
