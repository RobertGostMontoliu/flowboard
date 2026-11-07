export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "Urgent" | "High" | "Medium" | "Low";

export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  labels: string[];
  dueDate: string;
  assignee: string;
  progress: number;
}
