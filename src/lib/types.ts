import type { TaskCategory } from "./category";

export type TaskSource = "bruinlearn" | "email" | "manual";
export type TaskStatus = "active" | "done";

export interface Task {
  id: string;
  title: string;
  source: TaskSource;
  courseOrSender: string;
  dueDate: string | null;
  description: string;
  status: TaskStatus;
  reminderAt: string | null;
  createdAt: string;
  doneAt?: string | null;
  link?: string | null;
  category: TaskCategory;
}

export interface NotificationSettings {
  bruinlearnEnabled: boolean;
  emailEnabled: boolean;
  manualEnabled: boolean;
  defaultLeadMinutes: number;
  autoApplyDefaultOnSwipeLeft: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  bruinlearnEnabled: true,
  emailEnabled: true,
  manualEnabled: false,
  defaultLeadMinutes: 60,
  autoApplyDefaultOnSwipeLeft: true,
};
