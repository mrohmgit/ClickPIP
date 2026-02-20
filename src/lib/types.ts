// ClickPIP — TypeScript Types

export type UserRole = "super_admin" | "admin" | "manager" | "employee";

export type PIPStatus = "active" | "completed" | "failed" | "pending" | "extended";

export type PIPDuration = 30 | 60 | 90;

export type GoalRating = 1 | 2 | 3 | 4 | 5;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  avatarUrl: string;
  managerId: string | null;
}

export interface Department {
  id: string;
  name: string;
  managerId: string;
}

export interface PIPGoal {
  id: string;
  pipId: string;
  title: string;
  description: string;
  kpiTarget: string;
  kpiUnit: string;
  currentValue: number;
  targetValue: number;
  rating: GoalRating | null;
  status: "pending" | "in_progress" | "achieved" | "not_achieved";
}

export interface PIPRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  employeePosition: string;
  managerId: string;
  managerName: string;
  status: PIPStatus;
  duration: PIPDuration;
  startDate: string;
  endDate: string;
  reason: string;
  goals: PIPGoal[];
  overallRating: GoalRating | null;
  result: "passed" | "failed" | null;
  resultNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckIn {
  id: string;
  pipId: string;
  weekNumber: number;
  date: string;
  managerNote: string;
  employeeNote: string;
  goalUpdates: {
    goalId: string;
    previousValue: number;
    currentValue: number;
    note: string;
  }[];
  createdBy: string;
}

export interface Comment {
  id: string;
  pipId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  createdAt: string;
}

export interface Evaluation {
  id: string;
  pipId: string;
  evaluatorId: string;
  evaluatorName: string;
  goalRatings: {
    goalId: string;
    rating: GoalRating;
    note: string;
  }[];
  overallRating: GoalRating;
  result: "passed" | "failed";
  summary: string;
  createdAt: string;
}

export interface DashboardStats {
  totalActive: number;
  totalCompleted: number;
  totalFailed: number;
  totalPending: number;
  nearDeadline: number;
  passRate: number;
}
