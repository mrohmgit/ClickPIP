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

// ============================================
// Attendance Types
// ============================================

export type AttendanceStatus = "present" | "absent" | "leave" | "holiday" | "half_day";

export type LeaveRequestStatus = "pending" | "approved" | "rejected";

export type OvertimeRequestStatus = "pending" | "approved" | "rejected";

export interface AttendanceSettings {
  id: string;
  organizationId: string;
  departmentId: string | null;
  workStartTime: string;
  workEndTime: string;
  gracePeriodMinutes: number;
  halfDayHours: number;
  overtimeMinimumMinutes: number;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  isLate: boolean;
  lateMinutes: number;
  isEarlyLeave: boolean;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  status: AttendanceStatus;
  notes: string | null;
}

export interface LeaveType {
  id: string;
  name: string;
  description: string;
  maxDaysPerYear: number;
  isPaid: boolean;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveRequestStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface OvertimeRequest {
  id: string;
  userId: string;
  userName?: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string;
  status: OvertimeRequestStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

// ============================================
// Task Types
// ============================================

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskStatus = "todo" | "in_progress" | "review" | "done" | "cancelled";

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName?: string;
  assignedBy: string;
  assignedByName?: string;
  departmentId: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  completionQuality: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName?: string;
  content: string;
  createdAt: string;
}

// ============================================
// Assessment Types
// ============================================

export type AssessmentCycleType = "quarter" | "half_year" | "yearly";

export type AssessmentCycleStatus = "draft" | "open" | "review" | "completed";

export type AssessmentSubmissionStatus = "pending" | "self_assessed" | "reviewed" | "completed";

export type AssessmentGrade = "A" | "B+" | "B" | "C+" | "C" | "D";

export type CompensationStatus = "draft" | "proposed" | "approved" | "rejected";

export type KPIDataSource = "manual" | "attendance" | "tasks";

export interface KPICategory {
  id: string;
  name: string;
  description: string;
  defaultWeight: number;
}

export interface DepartmentKPIFactor {
  id: string;
  departmentId: string;
  kpiCategoryId: string;
  kpiCategoryName?: string;
  name: string;
  description: string;
  weight: number;
  target: number;
  dataSource: KPIDataSource;
}

export interface AssessmentCycle {
  id: string;
  name: string;
  type: AssessmentCycleType;
  periodStart: string;
  periodEnd: string;
  selfAssessmentDeadline: string;
  managerReviewDeadline: string;
  status: AssessmentCycleStatus;
  createdAt: string;
}

export interface AssessmentSubmission {
  id: string;
  cycleId: string;
  cycleName?: string;
  employeeId: string;
  employeeName?: string;
  managerId: string;
  managerName?: string;
  selfScores: Record<string, number> | null;
  managerScores: Record<string, number> | null;
  attendanceSummary: {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    leaveDays: number;
    overtimeHours: number;
  } | null;
  taskSummary: {
    totalTasks: number;
    completedTasks: number;
    averageQuality: number;
    onTimeRate: number;
  } | null;
  pipSummary: {
    totalPips: number;
    activePips: number;
    passedPips: number;
    failedPips: number;
  } | null;
  finalScore: number | null;
  finalGrade: AssessmentGrade | null;
  status: AssessmentSubmissionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CompensationPlan {
  id: string;
  assessmentCycleId: string;
  employeeId: string;
  employeeName?: string;
  currentSalary: number;
  proposedIncreasePercent: number;
  proposedBonusMonths: number;
  finalIncreasePercent: number | null;
  finalBonusMonths: number | null;
  status: CompensationStatus;
  approvedBy: string | null;
  notes: string | null;
  createdAt: string;
}

// ============================================
// AI-HR Types
// ============================================

export type AIGuardrailScope = "organization" | "department" | "role" | "individual";

export type AIGuardrailRuleType = "monitor_metric" | "alert_threshold" | "recommendation_trigger";

export type AIAlertSeverity = "info" | "warning" | "critical";

export interface AIKnowledgeDocument {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  category: string;
  uploadedBy: string;
  createdAt: string;
}

export interface AIGuardrail {
  id: string;
  name: string;
  description: string;
  scope: AIGuardrailScope;
  scopeId: string;
  ruleType: AIGuardrailRuleType;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

export interface AIAlert {
  id: string;
  guardrailId: string;
  userId: string;
  userName?: string;
  severity: AIAlertSeverity;
  title: string;
  description: string;
  recommendation: string;
  data: Record<string, unknown>;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
}

export interface AIChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources: { documentId: string; chunkText: string; score: number }[] | null;
  createdAt: string;
}

// ============================================
// Notification Types
// ============================================

export type NotificationType =
  | "pip_created" | "pip_updated" | "pip_deadline" | "pip_evaluated"
  | "attendance_late" | "attendance_absent" | "leave_request" | "leave_approved" | "leave_rejected"
  | "task_assigned" | "task_updated" | "task_due"
  | "assessment_open" | "assessment_reminder" | "assessment_completed"
  | "ai_alert" | "general";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

// ============================================
// Dashboard Extended Types
// ============================================

export interface ExtendedDashboardStats extends DashboardStats {
  attendanceToday: {
    present: number;
    late: number;
    absent: number;
    onLeave: number;
  };
  taskOverview: {
    total: number;
    inProgress: number;
    overdue: number;
    completedThisWeek: number;
  };
  assessmentStatus: {
    activeCycle: string | null;
    pendingReviews: number;
    completedReviews: number;
  };
  aiAlerts: {
    critical: number;
    warning: number;
    info: number;
  };
}
