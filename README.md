# Todo MCP Server

A comprehensive Todo/Task Manager MCP (Model Context Protocol) Server built with Node.js, TypeScript, and SQLite. This server provides tools, resources, and prompts for managing todos through Claude and other MCP-compatible clients.

## Features

### 🛠️ Tools (7 available)
- **create_todo** - Create new todos with title, description, priority, due date, and tags
- **update_todo** - Update existing todos (any field)
- **delete_todo** - Delete todos by ID
- **complete_todo** - Mark todos as completed
- **list_todos** - List todos with filtering (completion status, priority, tag, limit)
- **search_todos** - Search todos by title, description, or tags
- **get_todo_stats** - Get comprehensive todo statistics

### 📄 Resources (9 available)
- **todos://all** - All todos (JSON)
- **todos://completed** - Completed todos (JSON)
- **todos://pending** - Pending todos (JSON)
- **todos://overdue** - Overdue todos (JSON)
- **todos://todo/{id}** - Specific todo by ID (JSON)
- **todos://priority/{priority}** - Todos by priority (JSON) with autocomplete
- **todos://tag/{tag}** - Todos by tag (JSON) with autocomplete
- **todos://stats** - Todo statistics (JSON)
- **todos://tags** - All available tags (JSON)

### 💬 Prompts (5 available)
- **create_todo_prompt** - Interactive todo creation
- **daily_review** - Daily todo review and planning
- **weekly_planning** - Weekly planning session
- **productivity_analysis** - Analyze productivity patterns
- **task_breakdown** - Break down complex tasks

## Installation

1. **Clone or create the project directory:**
   ```bash
   mkdir todo-mcp-server
   cd todo-mcp-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## Usage

### Basic Server Operations

1. **Test the todo service:**
   ```bash
   npm run test
   ```

2. **Run the MCP server:**
   ```bash
   npm start
   ```

3. **Development mode (with file watching):**
   ```bash
   npm run dev
   ```

### Testing with MCP Inspector

1. **Start the inspector:**
   ```bash
   npx @modelcontextprotocol/inspector node dist/index.js
   ```

2. **Open the web interface:**
   - Follow the URL provided in the terminal output
   - Use the provided authentication token

### Claude Desktop Integration

Add this configuration to your Claude Desktop config file:

```json
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
```

## Configuration

### Environment Variables

- **TODO_DB_PATH**: Path to SQLite database file (default: `todos.db` in current directory)

### Database

The server uses SQLite with better-sqlite3 for data persistence. The database is automatically created with the following schema:

- **todos** table with fields: id, title, description, completed, priority, due_date, tags, created_at, updated_at
- Indexes on completion status, priority, due date, and creation date for optimal performance

## API Examples

### Creating a Todo
```javascript
// Using the create_todo tool
{
  "title": "Review documentation",
  "description": "Read through the MCP protocol documentation",
  "priority": "high",
  "dueDate": "2024-06-27T10:00:00.000Z",
  "tags": ["work", "learning"]
}
```

### Filtering Todos
```javascript
// Using the list_todos tool
{
  "completed": false,
  "priority": "high",
  "limit": 10
}
```

### Resource Access
```
GET todos://pending          # All pending todos
GET todos://priority/high    # High priority todos
GET todos://tag/work         # Todos tagged with "work"
GET todos://stats            # Todo statistics
```

## Architecture

```
src/
├── database.ts        # SQLite database layer with better-sqlite3
├── index.ts          # Main server entry point
├── mcp-server.ts     # MCP server implementation
├── todo-service.ts   # Business logic layer
├── test.ts          # Test suite
└── types.ts         # TypeScript type definitions
```

### Key Components

1. **TodoDatabase** - Direct SQLite interface with better-sqlite3
2. **TodoService** - Business logic with validation and error handling
3. **TodoMcpServer** - MCP protocol implementation with tools, resources, and prompts

## Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Development mode with file watching
- `npm start` - Start the production server
- `npm run test` - Run the test suite

### Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Database**: SQLite with better-sqlite3
- **Protocol**: Model Context Protocol (MCP)
- **Validation**: Zod schemas

## Testing

The project includes comprehensive testing:

```bash
npm run test
```

This will:
- Create an in-memory database
- Test all CRUD operations
- Verify search and filtering functionality
- Check statistics generation
- Validate tag management

## Troubleshooting

### Common Issues

1. **Database permission errors**: Ensure the directory is writable
2. **Port conflicts**: The MCP server uses stdio, no ports needed
3. **TypeScript errors**: Run `npm run build` to check for compilation issues

### Debugging

Enable debug logging by setting:
```bash
export DEBUG=todo-mcp-server
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Changelog

### v1.0.0
- Initial release
- Complete MCP implementation with tools, resources, and prompts
- SQLite database with better-sqlite3
- Comprehensive test suite
- Node.js compatibility (migrated from Bun)
