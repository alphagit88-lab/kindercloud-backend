/**
 * Role-Based Access Control Configuration
 * Defines permissions for each role in the system
 */

export enum Role {
  KID = "kid",
  TEACHER = "teacher",
  PARENT = "parent",
  ADMIN = "admin"
}

export enum Permission {
  // User permissions
  VIEW_OWN_PROFILE = "view:own:profile",
  EDIT_OWN_PROFILE = "edit:own:profile",
  VIEW_ANY_PROFILE = "view:any:profile",
  EDIT_ANY_PROFILE = "edit:any:profile",
  
  // Classroom permissions
  VIEW_CLASSROOMS = "view:classrooms",
  MANAGE_CLASSROOMS = "manage:classrooms",
  ASSIGN_TEACHERS = "assign:teachers",
  
  // Lesson & Diary permissions
  VIEW_LESSONS = "view:lessons",
  LOG_LESSONS = "log:lessons",
  MANAGE_DIARY = "manage:diary",
  APPROVE_DIARY = "approve:diary",
  
  // Booking/Event permissions (Renaming bookings to events)
  VIEW_EVENTS = "view:events",
  CREATE_EVENTS = "create:events",
  JOIN_EVENTS = "join:events",
  
  // Payment permissions
  MAKE_PAYMENTS = "make:payments",
  VIEW_OWN_PAYMENTS = "view:own:payments",
  VIEW_SALARIES = "view:salaries",
  
  // Parent & Kid permissions
  LINK_KIDS = "link:kids",
  VIEW_KID_PROGRESS = "view:kid:progress",
  
  // Inventory permissions
  MANAGE_INVENTORY = "manage:inventory",
  VIEW_INVENTORY = "view:inventory",
  
  // Admin permissions
  MANAGE_USERS = "manage:users",
  VIEW_FINANCIAL_REPORTS = "view:financial:reports",
  CONFIGURE_SYSTEM = "configure:system"
}

/**
 * Role-Permission mapping
 * Defines which permissions each role has
 */
export const RolePermissions: Record<Role, Permission[]> = {
  [Role.KID]: [
    Permission.VIEW_OWN_PROFILE,
    Permission.VIEW_LESSONS,
    Permission.VIEW_EVENTS,
  ],
  
  [Role.TEACHER]: [
    Permission.VIEW_OWN_PROFILE,
    Permission.EDIT_OWN_PROFILE,
    Permission.VIEW_CLASSROOMS,
    Permission.VIEW_LESSONS,
    Permission.LOG_LESSONS,
    Permission.MANAGE_DIARY,
    Permission.VIEW_EVENTS,
    Permission.VIEW_OWN_PAYMENTS,
  ],
  
  [Role.PARENT]: [
    Permission.VIEW_OWN_PROFILE,
    Permission.EDIT_OWN_PROFILE,
    Permission.VIEW_LESSONS,
    Permission.LINK_KIDS,
    Permission.VIEW_KID_PROGRESS,
    Permission.VIEW_EVENTS,
    Permission.MAKE_PAYMENTS,
    Permission.VIEW_OWN_PAYMENTS,
  ],
  
  [Role.ADMIN]: [
    // Admins have all permissions
    ...Object.values(Permission),
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = RolePermissions[role];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return RolePermissions[role] || [];
}
