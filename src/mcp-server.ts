// src/mcp-server.ts
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TodoService } from './todo-service.js';
import { Todo } from './types.js';

export class TodoMcpServer {
  private server: McpServer;
  private todoService: TodoService;

  constructor(dbPath?: string) {
    this.todoService = new TodoService(dbPath);
    this.server = new McpServer({
      name: "todo-manager",
      version: "1.0.0"
    });

    this.setupTools();
    this.setupResources();
    this.setupPrompts();
  }

  private setupTools(): void {
    // Create Todo Tool
    this.server.registerTool(
      "create_todo",
      {
        title: "Create Todo",
        description: "Create a new todo item",
        inputSchema: {
          title: z.string().min(1, "Title is required"),
          description: z.string().optional(),
          priority: z.enum(["low", "medium", "high"]).default("medium"),
          dueDate: z.string().optional().describe("ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)"),
          tags: z.array(z.string()).default([])
        }
      },
      async ({ title, description, priority, dueDate, tags }) => {
        try {
          const todo = await this.todoService.createTodo({
            title,
            description,
            priority,
            dueDate,
            tags
          });

          return {
            content: [{
              type: "text",
              text: `Created todo: ${todo.title} (ID: ${todo.id})`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error creating todo: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    // Update Todo Tool
    this.server.registerTool(
      "update_todo",
      {
        title: "Update Todo",
        description: "Update an existing todo item",
        inputSchema: {
          id: z.string().min(1, "Todo ID is required"),
          title: z.string().optional(),
          description: z.string().optional(),
          completed: z.boolean().optional(),
          priority: z.enum(["low", "medium", "high"]).optional(),
          dueDate: z.string().optional().describe("ISO date string"),
          tags: z.array(z.string()).optional()
        }
      },
      async ({ id, title, description, completed, priority, dueDate, tags }) => {
        try {
          const todo = await this.todoService.updateTodo(id, {
            title,
            description,
            completed,
            priority,
            dueDate,
            tags
          });

          return {
            content: [{
              type: "text",
              text: `Updated todo: ${todo.title} (ID: ${todo.id})`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error updating todo: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    // Delete Todo Tool
    this.server.registerTool(
      "delete_todo",
      {
        title: "Delete Todo",
        description: "Delete a todo item",
        inputSchema: {
          id: z.string().min(1, "Todo ID is required")
        }
      },
      async ({ id }) => {
        try {
          const deleted = await this.todoService.deleteTodo(id);

          if (deleted) {
            return {
              content: [{
                type: "text",
                text: `Deleted todo with ID: ${id}`
              }]
            };
          } else {
            return {
              content: [{
                type: "text",
                text: `Todo with ID ${id} not found`
              }],
              isError: true
            };
          }
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error deleting todo: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    // Complete Todo Tool
    this.server.registerTool(
      "complete_todo",
      {
        title: "Complete Todo",
        description: "Mark a todo as completed",
        inputSchema: {
          id: z.string().min(1, "Todo ID is required")
        }
      },
      async ({ id }) => {
        try {
          const todo = await this.todoService.completeTodo(id);
          return {
            content: [{
              type: "text",
              text: `Completed todo: ${todo.title}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error completing todo: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    // List Todos Tool
    this.server.registerTool(
      "list_todos",
      {
        title: "List Todos",
        description: "List todos with optional filtering",
        inputSchema: {
          completed: z.boolean().optional().describe("Filter by completion status"),
          priority: z.enum(["low", "medium", "high"]).optional().describe("Filter by priority"),
          tag: z.string().optional().describe("Filter by tag"),
          limit: z.number().min(1).max(100).default(20).describe("Maximum number of todos to return")
        }
      },
      async ({ completed, priority, tag, limit }) => {
        try {
          let todos = await this.todoService.getAllTodos({
            completed,
            priority,
            tag
          });

          // Apply limit
          todos = todos.slice(0, limit);

          const todoList = todos.map(todo =>
            `${todo.completed ? '✅' : '⭕'} ${todo.title} (${todo.priority}) [${todo.id}]${todo.dueDate ? ` - Due: ${new Date(todo.dueDate).toLocaleDateString()}` : ''
            }`
          ).join('\n');

          return {
            content: [{
              type: "text",
              text: todos.length > 0
                ? `Found ${todos.length} todos:\n\n${todoList}`
                : "No todos found matching the criteria"
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error listing todos: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    // Search Todos Tool
    this.server.registerTool(
      "search_todos",
      {
        title: "Search Todos",
        description: "Search todos by title, description, or tags",
        inputSchema: {
          query: z.string().min(1, "Search query is required"),
          limit: z.number().min(1).max(100).default(20)
        }
      },
      async ({ query, limit }) => {
        try {
          let todos = await this.todoService.searchTodos(query);
          todos = todos.slice(0, limit);

          const todoList = todos.map(todo =>
            `${todo.completed ? '✅' : '⭕'} ${todo.title} (${todo.priority}) [${todo.id}]${todo.dueDate ? ` - Due: ${new Date(todo.dueDate).toLocaleDateString()}` : ''
            }`
          ).join('\n');

          return {
            content: [{
              type: "text",
              text: todos.length > 0
                ? `Found ${todos.length} todos matching "${query}":\n\n${todoList}`
                : `No todos found matching "${query}"`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error searching todos: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    // Get Stats Tool
    this.server.registerTool(
      "get_todo_stats",
      {
        title: "Get Todo Statistics",
        description: "Get statistics about todos",
        inputSchema: {}
      },
      async () => {
        try {
          const stats = await this.todoService.getStats();

          const statsText = `
📊 Todo Statistics:
• Total: ${stats.total}
• Completed: ${stats.completed}
• Pending: ${stats.pending}
• Overdue: ${stats.overdue}

📈 By Priority:
• High: ${stats.byPriority.high}
• Medium: ${stats.byPriority.medium}
• Low: ${stats.byPriority.low}
          `.trim();

          return {
            content: [{
              type: "text",
              text: statsText
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error getting stats: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );
  }

  private setupResources(): void {
    // All Todos Resource
    this.server.registerResource(
      "all_todos",
      "todos://all",
      {
        title: "All Todos",
        description: "All todo items in the database",
        mimeType: "application/json"
      },
      async () => {
        const todos = await this.todoService.getAllTodos();
        return {
          contents: [{
            uri: "todos://all",
            mimeType: "application/json",
            text: JSON.stringify(todos, null, 2)
          }]
        };
      }
    );

    // Completed Todos Resource
    this.server.registerResource(
      "completed_todos",
      "todos://completed",
      {
        title: "Completed Todos",
        description: "All completed todo items",
        mimeType: "application/json"
      },
      async () => {
        const todos = await this.todoService.getCompletedTodos();
        return {
          contents: [{
            uri: "todos://completed",
            mimeType: "application/json",
            text: JSON.stringify(todos, null, 2)
          }]
        };
      }
    );

    // Pending Todos Resource
    this.server.registerResource(
      "pending_todos",
      "todos://pending",
      {
        title: "Pending Todos",
        description: "All pending todo items",
        mimeType: "application/json"
      },
      async () => {
        const todos = await this.todoService.getPendingTodos();
        return {
          contents: [{
            uri: "todos://pending",
            mimeType: "application/json",
            text: JSON.stringify(todos, null, 2)
          }]
        };
      }
    );

    // Overdue Todos Resource
    this.server.registerResource(
      "overdue_todos",
      "todos://overdue",
      {
        title: "Overdue Todos",
        description: "All overdue todo items",
        mimeType: "application/json"
      },
      async () => {
        const todos = await this.todoService.getOverdueTodos();
        return {
          contents: [{
            uri: "todos://overdue",
            mimeType: "application/json",
            text: JSON.stringify(todos, null, 2)
          }]
        };
      }
    );

    // Todo by ID Resource Template
    this.server.registerResource(
      "todo_by_id",
      new ResourceTemplate("todos://todo/{id}", { list: undefined }),
      {
        title: "Todo by ID",
        description: "Get a specific todo by its ID",
        mimeType: "application/json"
      },
      async (request: any) => {
        const { id } = request.params;
        const todo = await this.todoService.getTodoById(id);
        if (!todo) {
          throw new Error(`Todo with ID ${id} not found`);
        }
        return {
          contents: [{
            uri: request.uri.href,
            mimeType: "application/json",
            text: JSON.stringify(todo, null, 2)
          }]
        };
      }
    );

    // Todos by Priority Resource Template
    this.server.registerResource(
      "todos_by_priority",
      new ResourceTemplate("todos://priority/{priority}", {
        list: undefined,
        complete: {
          priority: (value) => {
            const priorities = ["low", "medium", "high"];
            return priorities.filter(p => p.startsWith(value.toLowerCase()));
          }
        }
      }),
      {
        title: "Todos by Priority",
        description: "Get todos filtered by priority level",
        mimeType: "application/json"
      },
      async (request: any) => {
        const { priority } = request.params;
        if (!["low", "medium", "high"].includes(priority)) {
          throw new Error(`Invalid priority: ${priority}. Must be low, medium, or high`);
        }
        const todos = await this.todoService.getTodosByPriority(priority as "low" | "medium" | "high");
        return {
          contents: [{
            uri: request.uri.href,
            mimeType: "application/json",
            text: JSON.stringify(todos, null, 2)
          }]
        };
      }
    );

    // Todos by Tag Resource Template
    this.server.registerResource(
      "todos_by_tag",
      new ResourceTemplate("todos://tag/{tag}", {
        list: undefined,
        complete: {
          tag: async (value) => {
            const allTags = await this.todoService.getAllTags();
            return allTags.filter(tag => tag.toLowerCase().includes(value.toLowerCase()));
          }
        }
      }),
      {
        title: "Todos by Tag",
        description: "Get todos filtered by tag",
        mimeType: "application/json"
      },
      async (request: any) => {
        const { tag } = request.params;
        const todos = await this.todoService.getTodosByTag(tag);
        return {
          contents: [{
            uri: request.uri.href,
            mimeType: "application/json",
            text: JSON.stringify(todos, null, 2)
          }]
        };
      }
    );

    // Todo Statistics Resource
    this.server.registerResource(
      "todo_stats",
      "todos://stats",
      {
        title: "Todo Statistics",
        description: "Statistics about all todos",
        mimeType: "application/json"
      },
      async () => {
        const stats = await this.todoService.getStats();
        return {
          contents: [{
            uri: "todos://stats",
            mimeType: "application/json",
            text: JSON.stringify(stats, null, 2)
          }]
        };
      }
    );

    // All Tags Resource
    this.server.registerResource(
      "all_tags",
      "todos://tags",
      {
        title: "All Tags",
        description: "All tags used in todos",
        mimeType: "application/json"
      },
      async () => {
        const tags = await this.todoService.getAllTags();
        return {
          contents: [{
            uri: "todos://tags",
            mimeType: "application/json",
            text: JSON.stringify(tags, null, 2)
          }]
        };
      }
    );
  }

  private setupPrompts(): void {
    // Create Todo Prompt
    this.server.registerPrompt(
      "create_todo_prompt",
      {
        title: "Create Todo",
        description: "Interactive prompt to create a new todo",
        argsSchema: {
          title: z.string().min(1, "Title is required"),
          description: z.string().optional(),
          priority: z.enum(["low", "medium", "high"]).optional(),
          dueDate: z.string().optional().describe("Due date (YYYY-MM-DD format)")
        }
      },
      ({ title, description, priority, dueDate }) => ({
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Please create a todo with the following details:
- Title: ${title}
${description ? `- Description: ${description}` : ''}
- Priority: ${priority || 'medium'}
${dueDate ? `- Due Date: ${dueDate}` : ''}

Use the create_todo tool to add this to the todo list.`
          }
        }]
      })
    );

    // Daily Review Prompt
    this.server.registerPrompt(
      "daily_review",
      {
        title: "Daily Todo Review",
        description: "Review today's todos and plan the day",
        argsSchema: {}
      },
      () => ({
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Please help me review my todos for today. Check:
1. Any overdue todos that need immediate attention
2. High priority todos for today
3. Upcoming deadlines this week
4. Provide a summary and recommendations for prioritizing my day

Use the list_todos and get_todo_stats tools to analyze my current todo situation.`
          }
        }]
      })
    );

    // Weekly Planning Prompt
    this.server.registerPrompt(
      "weekly_planning",
      {
        title: "Weekly Todo Planning",
        description: "Plan the week ahead based on todos",
        argsSchema: {}
      },
      () => ({
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Help me plan my week by analyzing my todo list:
1. Show me all pending todos
2. Identify overdue items that need immediate attention
3. Group tasks by priority and estimated time
4. Suggest a weekly schedule
5. Recommend any todos that should be broken down into smaller tasks

Use the available todo tools to gather this information and provide actionable insights.`
          }
        }]
      })
    );

    // Productivity Analysis Prompt
    this.server.registerPrompt(
      "productivity_analysis",
      {
        title: "Productivity Analysis",
        description: "Analyze productivity patterns from todo completion data",
        argsSchema: {}
      },
      () => ({
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Analyze my productivity patterns based on my todo data:
1. Show completion statistics
2. Identify patterns in overdue tasks
3. Analyze priority distribution
4. Suggest improvements to my todo management
5. Recommend strategies for better task completion

Use the todo statistics and listing tools to provide insights about my productivity habits.`
          }
        }]
      })
    );

    // Task Breakdown Prompt
    this.server.registerPrompt(
      "task_breakdown",
      {
        title: "Break Down Complex Task",
        description: "Help break down a complex todo into smaller, manageable tasks",
        argsSchema: {
          todoId: z.string().min(1, "Todo ID is required"),
          context: z.string().optional().describe("Additional context about the task")
        }
      },
      ({ todoId, context }) => ({
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `I need help breaking down a complex task into smaller, manageable todos.

Todo ID: ${todoId}
${context ? `Additional context: ${context}` : ''}

Please:
1. First, get the details of this todo using the appropriate tool
2. Analyze the task and suggest 3-5 smaller, actionable subtasks
3. Recommend priorities and estimated timeframes for each subtask
4. Suggest whether the original task should be updated or replaced with the subtasks

Use the todo tools to examine the task and provide a detailed breakdown plan.`
          }
        }]
      })
    );
  }

  getServer(): McpServer {
    return this.server;
  }

  async close(): Promise<void> {
    await this.todoService.close();
  }
}
