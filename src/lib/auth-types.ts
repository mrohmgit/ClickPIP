import type { UserRole } from "./types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      departmentId: string | null;
      employeeCode: string | null;
    };
  }
}
