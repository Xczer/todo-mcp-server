// src/test.ts - Simple test script to verify the todo functionality
import { TodoService } from './todo-service.js';

async function testTodoService() {
  console.log('🧪 Testing Todo Service...\n');

  const todoService = new TodoService(':memory:'); // Use in-memory database for testing

  try {
    // Test creating todos
    console.log('📝 Creating todos...');
    const todo1 = await todoService.createTodo({
      title: 'Buy groceries',
      description: 'Milk, bread, eggs',
      priority: 'medium',
      tags: ['shopping', 'personal']
    });
    console.log('✅ Created:', todo1.title);

    const todo2 = await todoService.createTodo({
      title: 'Review MCP documentation',
      description: 'Read through the Model Context Protocol docs',
      priority: 'high',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      tags: ['work', 'learning']
    });
    console.log('✅ Created:', todo2.title);

    const todo3 = await todoService.createTodo({
      title: 'Exercise',
      priority: 'low',
      tags: ['health', 'personal']
    });
    console.log('✅ Created:', todo3.title);

    // Test listing todos
    console.log('\n📋 All todos:');
    const allTodos = await todoService.getAllTodos();
    allTodos.forEach(todo => {
      console.log(`- ${todo.completed ? '✅' : '⭕'} ${todo.title} (${todo.priority})`);
    });

    // Test completing a todo
    console.log('\n✅ Completing first todo...');
    await todoService.completeTodo(todo1.id);

    // Test filtering
    console.log('\n🔍 Pending todos:');
    const pendingTodos = await todoService.getPendingTodos();
    pendingTodos.forEach(todo => {
      console.log(`- ${todo.title} (${todo.priority})`);
    });

    // Test searching
    console.log('\n🔎 Searching for "MCP":');
    const searchResults = await todoService.searchTodos('MCP');
    searchResults.forEach(todo => {
      console.log(`- ${todo.title}`);
    });

    // Test stats
    console.log('\n📊 Statistics:');
    const stats = await todoService.getStats();
    console.log(JSON.stringify(stats, null, 2));

    // Test tags
    console.log('\n🏷️ All tags:');
    const tags = await todoService.getAllTags();
    console.log(tags.join(', '));

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await todoService.close();
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testTodoService();
}

// Example usage with MCP Inspector
export const exampleUsage = `
# Todo MCP Server Usage Examples

## Installation and Setup

1. Install dependencies:
   npm install

2. Build the project:
   npm run build

3. Test the todo service:
   npm run test

4. Run the MCP server:
   npm start

## Testing with MCP Inspector

1. Install MCP Inspector:
   npx @modelcontextprotocol/inspector

2. Test the server:
   npx @modelcontextprotocol/inspector node dist/index.js

## Available Tools

1. **create_todo** - Create a new todo
   - title (required): Todo title
   - description (optional): Todo description
   - priority (optional): low/medium/high
   - dueDate (optional): ISO date string
   - tags (optional): Array of tags

2. **update_todo** - Update an existing todo
   - id (required): Todo ID
   - Other fields are optional updates

3. **delete_todo** - Delete a todo
   - id (required): Todo ID

4. **complete_todo** - Mark todo as completed
   - id (required): Todo ID

5. **list_todos** - List todos with filtering
   - completed (optional): Filter by completion status
   - priority (optional): Filter by priority
   - tag (optional): Filter by tag
   - limit (optional): Maximum results (default: 20)

6. **search_todos** - Search todos
   - query (required): Search term
   - limit (optional): Maximum results

7. **get_todo_stats** - Get todo statistics

## Available Resources

1. **todos://all** - All todos (JSON)
2. **todos://completed** - Completed todos (JSON)
3. **todos://pending** - Pending todos (JSON)
4. **todos://overdue** - Overdue todos (JSON)
5. **todos://todo/{id}** - Specific todo by ID (JSON)
6. **todos://priority/{priority}** - Todos by priority (JSON)
7. **todos://tag/{tag}** - Todos by tag (JSON)
8. **todos://stats** - Todo statistics (JSON)
9. **todos://tags** - All available tags (JSON)

## Available Prompts

1. **create_todo_prompt** - Interactive todo creation
2. **daily_review** - Daily todo review and planning
3. **weekly_planning** - Weekly planning session
4. **productivity_analysis** - Analyze productivity patterns
5. **task_breakdown** - Break down complex tasks

## Configuration

Set the database path with environment variable:
export TODO_DB_PATH=/path/to/your/todos.db

Default: todos.db in current directory

## Claude Desktop Integration

Add to your Claude Desktop config:

{
  "mcpServers": {
    "todo-manager": {
      "command": "node",
      "args": ["/path/to/todo-mcp-server/dist/index.js"],
      "env": {
        "TODO_DB_PATH": "/path/to/your/todos.db"
      }
    }
  }
}
`;

console.log(exampleUsage);
