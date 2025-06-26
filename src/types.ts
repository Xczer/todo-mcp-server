// src/types.ts
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO string
  tags: string[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags?: string[];
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags?: string[];
}

export interface TodoFilter {
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  tag?: string;
  dueBefore?: string;
  dueAfter?: string;
}
