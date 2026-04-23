import "../types/express-session";
import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";

import { FileStorageService } from "../services/FileStorageService";

const authService = new AuthService();
const fileStorageService = new FileStorageService();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          error: "Email, password, first name, and last name are required",
        });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Password strength validation
      if (password.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters long" });
      }

      // Password complexity validation
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

      if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
        return res.status(400).json({
          error: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        });
      }

      // Role validation (prevent "admin" registration via public endpoint)
      if (role && !["kid", "teacher", "parent"].includes(role)) {
        return res.status(400).json({
          error: "Invalid role. Must be kid, teacher, or parent. Admin registration is not permitted.",
        });
      }

      const user = await authService.register({
        email,
        password,
        firstName,
        lastName,
        role,
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Set session for cookie-based auth
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userEmail = user.email;

      // Force session save before sending response
      req.session.save((err) => {
        if (err) {
          console.error("Session save error during registration:", err);
        }
        res.status(201).json({
          message: "Registration successful",
          user,
          token
        });
      });
    } catch (error: any) {
      if (error.message === "User with this email already exists") {
        return res.status(409).json({ error: error.message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response) {
    try {
      console.log("Login attempt:", req.body.email);
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      // Check DB connection first to avoid 500 later
      if (!AppDataSource.isInitialized) {
        console.error("Database not initialized. Cannot process login.");
        return res.status(503).json({ error: "Service unavailable. Database connecting..." });
      }

      console.log("Calling authService.login...");
      const user = await authService.login(email, password);
      console.log("User logged in successfully:", user.id);

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Set session for cookie-based auth
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userEmail = user.email;

      // Force session save before sending response
      req.session.save((err) => {
        if (err) {
          console.error("Session save error during login:", err);
        }
        res.json({
          message: "Login successful",
          user,
          token
        });
      });
    } catch (error: any) {
      if (
        error.message === "Invalid email or password" ||
        error.message === "Account is deactivated"
      ) {
        console.warn(`Login failed for ${req.body.email}: ${error.message}`);
        return res.status(401).json({ error: error.message });
      }
      console.error("Login error details:", error);
      console.error("Stack trace:", error.stack);
      // Return detailed error message for debugging purposes
      res.status(500).json({ error: "Login failed", details: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response) {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ error: "Logout failed" });
        }

        res.clearCookie("connect.sid");
        res.json({ message: "Logout successful" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  static async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await authService.getUserById(req.session.userId);

      res.json({ user });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ error: "Failed to get user information" });
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  static async updateProfile(req: Request, res: Response) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { firstName, lastName, bio, profilePicture } = req.body;

      const user = await authService.updateProfile(req.session.userId, {
        firstName,
        lastName,
        bio,
        profilePicture,
      });

      res.json({
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }

  /**
   * Change password
   * PUT /api/auth/change-password
   */
  static async changePassword(req: Request, res: Response) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { currentPassword, newPassword } = req.body;

      // Validation
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: "Current password and new password are required",
        });
      }

      if (newPassword.length < 8) {
        return res
          .status(400)
          .json({ error: "New password must be at least 8 characters long" });
      }

      // Password complexity validation
      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasLowerCase = /[a-z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

      if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
        return res.status(400).json({
          error: "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        });
      }

      const result = await authService.changePassword(
        req.session.userId,
        currentPassword,
        newPassword
      );

      res.json(result);
    } catch (error: any) {
      if (error.message === "Current password is incorrect") {
        return res.status(400).json({ error: error.message });
      }
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  }

  /**
   * Forgot password - request a reset token
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const result = await authService.forgotPassword(email);

      // Always return 200 to avoid revealing whether an email exists
      res.json(result);
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  }

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, token, newPassword } = req.body;

      // Validation
      if (!email || !token || !newPassword) {
        return res.status(400).json({
          error: "Email, token, and new password are required",
        });
      }

      if (newPassword.length < 8) {
        return res
          .status(400)
          .json({ error: "New password must be at least 8 characters long" });
      }

      // Password complexity validation
      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasLowerCase = /[a-z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

      if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
        return res.status(400).json({
          error: "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        });
      }

      const result = await authService.resetPassword(email, token, newPassword);

      res.json(result);
    } catch (error: any) {
      if (error.message === "Invalid or expired reset token") {
        return res.status(400).json({ error: error.message });
      }
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  }

  /**
   * Check authentication status
   * GET /api/auth/status
   */
  static async checkStatus(req: Request, res: Response) {
    res.json({
      isAuthenticated: !!req.session.userId,
      userId: req.session.userId || null,
      userEmail: req.session.userEmail || null,
      userRole: req.session.userRole || null,
    });
  }

  /**
   * Upload profile picture
   * POST /api/auth/profile-picture
   */
  static async uploadProfilePicture(req: Request, res: Response) {
    try {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: req.session.userId } });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let profilePictureUrl = "";

      if (req.file) {
        // Delete old profile picture if it exists
        if (user.profilePicture) {
          await fileStorageService.deleteFile(user.profilePicture);
        }

        const fileResult = await fileStorageService.saveFile(
          req.file as any,
          "images",
          req.session.userId!
        );
        profilePictureUrl = fileResult.fileUrl;
      } else if (req.body.profilePictureUrl) {
        profilePictureUrl = req.body.profilePictureUrl;
      } else {
        return res.status(400).json({ error: "No image file or URL provided" });
      }

      user.profilePicture = profilePictureUrl;
      await userRepo.save(user);

      // Return the updated user (without password)
      const { password: _, ...safeUser } = user as any;


      res.json({
        message: "Profile picture updated successfully",
        user: safeUser,
      });
    } catch (error) {
      console.error("Upload profile picture error:", error);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  }

  /**
   * Delete profile picture
   * DELETE /api/auth/profile-picture
   */
  static async deleteProfilePicture(req: Request, res: Response) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: req.session.userId } });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete the file from disk or Blob
      if (user.profilePicture) {
        await fileStorageService.deleteFile(user.profilePicture);
      }

      user.profilePicture = undefined;
      await userRepo.save(user);

      const { password: _, ...safeUser } = user as any;

      res.json({
        message: "Profile picture removed",
        user: safeUser,
      });
    } catch (error) {
      console.error("Delete profile picture error:", error);
      res.status(500).json({ error: "Failed to delete profile picture" });
    }
  }

  /**
   * Switch Profile (Parent -> Kid)
   * POST /api/auth/switch-profile
   */
  static async switchProfile(req: Request, res: Response) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { kidId } = req.body;
      if (!kidId) {
        return res.status(400).json({ error: "kidId is required" });
      }

      const parentId = req.session.userId;
      
      const kidProfile = await authService.switchProfile(parentId, kidId);

      // Issue new session/token mimicking the kid
      const token = jwt.sign(
        { userId: kidProfile.id, email: kidProfile.email, role: kidProfile.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Update session to reflect the switched profile
      req.session.userId = kidProfile.id;
      req.session.userRole = kidProfile.role;
      req.session.userEmail = kidProfile.email;

      // Force session save before sending response
      req.session.save((err) => {
        if (err) {
          console.error("Session save error during profile switch:", err);
        }
        res.json({
          message: "Switched to Kid profile successfully",
          user: kidProfile,
          token
        });
      });
    } catch (error: any) {
      console.error("Switch profile error:", error);
      res.status(403).json({ error: error.message || "Failed to switch profile" });
    }
  }
}
