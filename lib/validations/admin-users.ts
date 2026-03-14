import { z } from "zod";

const allowedRoles = ["tenant_admin", "receptionist", "phlebotomist", "technician", "pathologist", "finance"] as const;

export const createAdminUserSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  role: z.enum(allowedRoles),
  password: z.string().min(8).max(128),
});

export const updateAdminUserRoleSchema = z.object({
  auth_user_id: z.string().uuid(),
  role: z.enum(allowedRoles),
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserRoleInput = z.infer<typeof updateAdminUserRoleSchema>;
