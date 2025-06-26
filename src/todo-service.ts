// src/todo-service.ts
import { TodoDatabase } from './database.js';
import { Todo, CreateTodoInput, UpdateTodoInput, TodoFilter } from './types.js';

export class TodoService {
  private db: TodoDatabase;

  constructor(dbPath?: string) {
    this.db = new TodoDatabase(dbPath);
  }

  async createTodo(input: CreateTodoInput): Promise<Todo> {
    // Validate input
    if (!input.title?.trim()) {
      throw new Error('Todo title is required');
    }

    // Validate due date if provided
    if (input.dueDate) {
      const dueDate = new Date(input.dueDate);
      if (isNaN(dueDate.getTime())) {
        throw new Error('Invalid due date format');
      }
    }

    // Validate priority
    if (input.priority && !['low', 'medium', 'high'].includes(input.priority)) {
      throw new Error('Priority must be low, medium, or high');
    }

    return this.db.createTodo({
      ...input,
      title: input.title.trim(),
      description: input.description?.trim(),
      tags: input.tags?.filter(tag => tag.trim()).map(tag => tag.trim()) || []
    });
  }

  async getTodoById(id: string): Promise<Todo | null> {
    if (!id?.trim()) {
      throw new Error('Todo ID is required');
    }
    return this.db.getTodoById(id);
  }

  async getAllTodos(filter?: TodoFilter): Promise<Todo[]> {
    return this.db.getAllTodos(filter);
  }

  async updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
    if (!id?.trim()) {
      throw new Error('Todo ID is required');
    }

    const existing = await this.db.getTodoById(id);
    if (!existing) {
      throw new Error(`Todo with ID ${id} not found`);
    }

    // Validate updates
    if (input.title !== undefined && !input.title.trim()) {
      throw new Error('Todo title cannot be empty');
    }

    if (input.dueDate) {
      const dueDate = new Date(input.dueDate);
      if (isNaN(dueDate.getTime())) {
        throw new Error('Invalid due date format');
      }
    }

    if (input.priority && !['low', 'medium', 'high'].includes(input.priority)) {
      throw new Error('Priority must be low, medium, or high');
    }

    const updateData = { ...input };
    if (updateData.title) {
      updateData.title = updateData.title.trim();
    }
    if (updateData.description !== undefined) {
      updateData.description = updateData.description?.trim();
    }
    if (updateData.tags) {
      updateData.tags = updateData.tags.filter(tag => tag.trim()).map(tag => tag.trim());
    }

    const updated = await this.db.updateTodo(id, updateData);
    if (!updated) {
      throw new Error(`Failed to update todo with ID ${id}`);
    }

    return updated;
  }

  async deleteTodo(id: string): Promise<boolean> {
    if (!id?.trim()) {
      throw new Error('Todo ID is required');
    }

    const existing = await this.db.getTodoById(id);
    if (!existing) {
      throw new Error(`Todo with ID ${id} not found`);
    }

    return this.db.deleteTodo(id);
  }

  async completeTodo(id: string): Promise<Todo> {
    return this.updateTodo(id, { completed: true });
  }

  async uncompleteTodo(id: string): Promise<Todo> {
    return this.updateTodo(id, { completed: false });
  }

  async getCompletedTodos(): Promise<Todo[]> {
    return this.db.getCompletedTodos();
  }

  async getPendingTodos(): Promise<Todo[]> {
    return this.db.getPendingTodos();
  }

  async getTodosByPriority(priority: 'low' | 'medium' | 'high'): Promise<Todo[]> {
    return this.db.getTodosByPriority(priority);
  }

  async getTodosByTag(tag: string): Promise<Todo[]> {
    if (!tag?.trim()) {
      throw new Error('Tag is required');
    }
    return this.db.getTodosByTag(tag.trim());
  }

  async getOverdueTodos(): Promise<Todo[]> {
    return this.db.getOverdueTodos();
  }

  async getAllTags(): Promise<string[]> {
    return this.db.getAllTags();
  }

  async getStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    byPriority: { low: number; medium: number; high: number };
  }> {
    const [allTodos, overdueTodos] = await Promise.all([
      this.getAllTodos(),
      this.getOverdueTodos()
    ]);

    const completed = allTodos.filter(todo => todo.completed).length;
    const pending = allTodos.length - completed;

    const byPriority = allTodos.reduce(
      (acc, todo) => {
        acc[todo.priority]++;
        return acc;
      },
      { low: 0, medium: 0, high: 0 }
    );

    return {
      total: allTodos.length,
      completed,
      pending,
      overdue: overdueTodos.length,
      byPriority
    };
  }

  async searchTodos(query: string): Promise<Todo[]> {
    if (!query?.trim()) {
      return this.getAllTodos();
    }

    const allTodos = await this.getAllTodos();
    const searchTerm = query.toLowerCase().trim();

    return allTodos.filter(todo =>
      todo.title.toLowerCase().includes(searchTerm) ||
      todo.description?.toLowerCase().includes(searchTerm) ||
      todo.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}
