// src/database.ts - Node.js compatible version using better-sqlite3
import Database from 'better-sqlite3';
import { Todo, CreateTodoInput, UpdateTodoInput, TodoFilter } from './types.js';

export class TodoDatabase {
  private db: Database.Database;

  constructor(dbPath: string = 'todos.db') {
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    // Enable foreign keys and WAL mode for better performance
    this.db.exec('PRAGMA foreign_keys = ON');
    this.db.exec('PRAGMA journal_mode = WAL');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        priority TEXT DEFAULT 'medium',
        due_date TEXT,
        tags TEXT, -- JSON array as string
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `;

    this.db.exec(createTableSQL);

    // Create indexes for better performance
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at)');
  }

  async createTodo(input: CreateTodoInput): Promise<Todo> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const todo: Todo = {
      id,
      title: input.title,
      description: input.description,
      completed: false,
      priority: input.priority || 'medium',
      dueDate: input.dueDate,
      tags: input.tags || [],
      createdAt: now,
      updatedAt: now
    };

    const stmt = this.db.prepare(`
      INSERT INTO todos (id, title, description, completed, priority, due_date, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      todo.id,
      todo.title,
      todo.description || null,
      todo.completed ? 1 : 0,
      todo.priority,
      todo.dueDate || null,
      JSON.stringify(todo.tags),
      todo.createdAt,
      todo.updatedAt
    );

    return todo;
  }

  async getTodoById(id: string): Promise<Todo | null> {
    const stmt = this.db.prepare('SELECT * FROM todos WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToTodo(row);
  }

  async getAllTodos(filter?: TodoFilter): Promise<Todo[]> {
    let sql = 'SELECT * FROM todos';
    const params: any[] = [];
    const conditions: string[] = [];

    if (filter) {
      if (filter.completed !== undefined) {
        conditions.push('completed = ?');
        params.push(filter.completed ? 1 : 0);
      }

      if (filter.priority) {
        conditions.push('priority = ?');
        params.push(filter.priority);
      }

      if (filter.dueBefore) {
        conditions.push('due_date <= ?');
        params.push(filter.dueBefore);
      }

      if (filter.dueAfter) {
        conditions.push('due_date >= ?');
        params.push(filter.dueAfter);
      }

      if (filter.tag) {
        conditions.push('tags LIKE ?');
        params.push(`%"${filter.tag}"%`);
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.rowToTodo(row));
  }

  async updateTodo(id: string, input: UpdateTodoInput): Promise<Todo | null> {
    const existing = await this.getTodoById(id);
    if (!existing) return null;

    const updated: Todo = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString()
    };

    const stmt = this.db.prepare(`
      UPDATE todos
      SET title = ?, description = ?, completed = ?, priority = ?,
          due_date = ?, tags = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      updated.title,
      updated.description || null,
      updated.completed ? 1 : 0,
      updated.priority,
      updated.dueDate || null,
      JSON.stringify(updated.tags),
      updated.updatedAt,
      id
    );

    return updated;
  }

  async deleteTodo(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM todos WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async getCompletedTodos(): Promise<Todo[]> {
    return this.getAllTodos({ completed: true });
  }

  async getPendingTodos(): Promise<Todo[]> {
    return this.getAllTodos({ completed: false });
  }

  async getTodosByPriority(priority: 'low' | 'medium' | 'high'): Promise<Todo[]> {
    return this.getAllTodos({ priority });
  }

  async getTodosByTag(tag: string): Promise<Todo[]> {
    return this.getAllTodos({ tag });
  }

  async getOverdueTodos(): Promise<Todo[]> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      SELECT * FROM todos
      WHERE completed = 0 AND due_date IS NOT NULL AND due_date < ?
      ORDER BY due_date ASC
    `);
    const rows = stmt.all(now) as any[];
    return rows.map(row => this.rowToTodo(row));
  }

  async getAllTags(): Promise<string[]> {
    const stmt = this.db.prepare('SELECT DISTINCT tags FROM todos WHERE tags IS NOT NULL AND tags != ?');
    const rows = stmt.all('[]') as any[];

    const allTags = new Set<string>();
    rows.forEach(row => {
      try {
        const tags = JSON.parse(row.tags || '[]');
        if (Array.isArray(tags)) {
          tags.forEach((tag: string) => allTags.add(tag));
        }
      } catch (e) {
        // Ignore invalid JSON
      }
    });

    return Array.from(allTags).sort();
  }

  private rowToTodo(row: any): Todo {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      completed: Boolean(row.completed),
      priority: row.priority,
      dueDate: row.due_date,
      tags: JSON.parse(row.tags || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  close(): void {
    this.db.close();
  }

  // Additional utility methods

  // Get database statistics
  getDbStats(): { totalTodos: number; dbSize: number } {
    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM todos');
    const countResult = countStmt.get() as { count: number };

    // Get database file size
    const pragmaStmt = this.db.prepare('PRAGMA page_count');
    const pageResult = pragmaStmt.get() as { page_count: number };

    return {
      totalTodos: countResult.count,
      dbSize: pageResult.page_count * 4096 // Assuming 4KB page size
    };
  }

  // Vacuum database to optimize storage
  vacuum(): void {
    this.db.exec('VACUUM');
  }
}
