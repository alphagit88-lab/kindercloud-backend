import "../types/express-session";
import { Request, Response, NextFunction } from "express";
import { Permission, Role, hasPermission, getRolePermissions } from "../config/permissions";
import { AppDataSource } from "../config/data-source";
import { ClassRoom } from "../entities/ClassRoom";
import { Lesson } from "../entities/Lesson";
import { Diary } from "../entities/Diary";

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/**
 * Middleware to check if user is authenticated
 * Verifies JWT token or that a valid session exists with userId
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.session.userId = decoded.userId;
      req.session.userRole = decoded.role;
      req.session.userEmail = decoded.email;
      return next();
    } catch (e) {
      return res.status(401).json({
        error: "Invalid token",
        message: "Your unauthenticated token is expired or invalid",
      });
    }
  }

  if (!req.session.userId) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Please log in to access this resource",
    });
  }

  next();
};

/**
 * Middleware to check if user has required role(s)
 * Must be used after authenticate middleware
 * @param roles - Array of allowed roles or single role string
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(`[Authorize] Path: ${req.originalUrl}, Required: [${roles.join(", ")}], SessionRole: '${req.session.userRole}'`);
    if (!req.session.userId) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Please log in to access this resource",
      });
    }

    if (!req.session.userRole) {
      return res.status(403).json({
        error: "Access denied",
        message: "User role not found",
      });
    }

    const userRole = req.session.userRole?.trim();
    if (!userRole || !roles.some(r => r.toLowerCase() === userRole.toLowerCase())) {
      console.warn(`[Authorize] Access denied for user ${req.session.userId} (${req.session.userEmail}). Role in session: '${userRole}'. Required one of: [${roles.join(", ")}]`);
      return res.status(403).json({
        error: "Access denied",
        message: `[DEBUG_AUTH] This resource requires one of the following roles: ${roles.join(", ")}. Your current role is: '${userRole}'. Please contact support or logout and login again.`,
        requiredRole: roles,
        yourRole: userRole
      });
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 * Checks if user has specific permission based on their role
 * @param permission - Required permission from Permission enum
 */
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId || !req.session.userRole) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Please log in to access this resource",
      });
    }

    const userRole = req.session.userRole as Role;
    
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({
        error: "Access denied",
        message: `You don't have permission: ${permission}`,
        requiredPermission: permission,
        yourPermissions: getRolePermissions(userRole),
      });
    }

    next();
  };
};

/**
 * Resource ownership validation middleware
 * Verifies that the authenticated user owns the requested resource
 * Admin users bypass this check
 * @param resourceType - Entity name (e.g., 'Course', 'Lesson') - MUST be from whitelist
 * @param resourceIdParam - Request parameter containing resource ID (default: 'id')
 * @param ownerField - Field name in entity that contains owner ID (default: 'instructorId')
 */
// Whitelist of allowed resource types to prevent SQL injection
const ALLOWED_RESOURCE_TYPES = {
  ClassRoom: { entity: ClassRoom, ownerField: "teacherId" },
  Lesson: { entity: Lesson, ownerField: "teacherId" },
  Diary: { entity: Diary, ownerField: "teacherId" },
} as const;

type AllowedResourceType = keyof typeof ALLOWED_RESOURCE_TYPES;

export const requireOwnership = (
  resourceType: string,
  resourceIdParam: string = "id",
  ownerField?: string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.session.userId;
      const userRole = req.session.userRole;

      // Admin bypasses ownership check
      if (userRole === "admin") {
        return next();
      }

      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({
          error: "Resource ID not provided",
        });
      }

      // Ensure resourceId is a string (handle case where it might be an array)
      const finalResourceId = Array.isArray(resourceId) ? resourceId[0] : resourceId;

      // Validate resourceType against whitelist to prevent SQL injection
      if (!(resourceType in ALLOWED_RESOURCE_TYPES)) {
        return res.status(400).json({
          error: "Invalid resource type",
          message: `Resource type '${resourceType}' is not allowed`,
        });
      }

      const resourceConfig = ALLOWED_RESOURCE_TYPES[resourceType as AllowedResourceType];
      const finalOwnerField = ownerField || resourceConfig.ownerField;

      // Get repository for the resource type (now safe from injection)
      const repository = AppDataSource.getRepository(resourceConfig.entity);
      const resource = await repository.findOne({
        where: { id: finalResourceId },
      });

      if (!resource) {
        return res.status(404).json({
          error: `${resourceType} not found`,
        });
      }

      // Check ownership
      const ownerId = (resource as any)[finalOwnerField];
      
      if (ownerId !== userId) {
        return res.status(403).json({
          error: "Access denied",
          message: `You don't have permission to access this ${resourceType.toLowerCase()}`,
        });
      }

      next();
    } catch (error) {
      console.error("Ownership validation error:", error);
      res.status(500).json({
        error: "Failed to validate resource ownership",
      });
    }
  };
};

/**
 * Middleware to check if user is admin
 * Shorthand for authorize('admin')
 */
export const isAdmin = authorize("admin");

/**
 * Middleware to check if user is teacher or admin
 * Common permission pattern for management
 */
export const isTeacherOrAdmin = authorize("teacher", "admin");

/**
 * Middleware to check if user is kid (any authenticated user can act as a kid)
 */
export const isKid = authenticate;

/**
 * Middleware to check if user is teacher
 */
export const isTeacher = authorize("teacher");

/**
 * Middleware to check if user is parent
 */
export const isParent = authorize("parent");

/**
 * Middleware to sanitize user data before sending response
 * Removes sensitive fields like password, even if accidentally included
 */
export const sanitizeUserData = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalJson = res.json.bind(res);
  
  res.json = function (data: any): Response {
    // Recursively remove password fields
    const sanitize = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      // Preserve Date objects — spreading them produces an empty plain object {}
      if (obj instanceof Date) {
        return obj;
      }
      
      if (obj && typeof obj === "object") {
        const sanitized = { ...obj };
        
        // Remove sensitive fields
        delete sanitized.password;
        
        // Recursively sanitize nested objects
        Object.keys(sanitized).forEach(key => {
          if (sanitized[key] && typeof sanitized[key] === "object") {
            sanitized[key] = sanitize(sanitized[key]);
          }
        });
        
        return sanitized;
      }
      
      return obj;
    };
    
    return originalJson(sanitize(data));
  };
  
  next();
};
