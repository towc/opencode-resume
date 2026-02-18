# opencode-resume

Resume or create OpenCode sessions by title with an interactive fuzzy-search picker. Never lose track of your project sessions again!

## What It Does

`opencode-resume` intelligently manages OpenCode sessions:

1. **Interactive picker** - Run without arguments for a fuzzy-search TUI to browse and select sessions
2. **Direct resume** - Pass a title to resume or create a session instantly
3. **Smart matching** - Normalizes titles for flexible matching (case-insensitive, spaces/underscores → hyphens)
4. **Auto-starts server** - Automatically starts `opencode serve` if not running

## Quick Start

```bash
# Interactive session picker (recommended)
o

# Direct resume/create by title
o "my-session"
```

## Interactive Picker

When run without arguments, shows an interactive TUI:

```
 /   type to search
↑↓ navigate | enter select | ^n new | esc quit

> my-session          14:30  let's update the keybinds...
  api-server          yesterday  can you help me fix the...
  database-work       3d ago  add migration for users...
```

Each session shows:
- **Title** - Session name (left-aligned)
- **Timestamp** - When last updated (24hr format, or relative like "yesterday", "3d ago")
- **Preview** - Last user message (truncated to fit terminal width)

**Controls:**
- **Type** - Fuzzy search sessions by title
- **↑/↓** - Navigate list
- **Enter** - Resume selected session
- **Ctrl+N** - Create new session with search query as title
- **Esc** - Quit

## Prerequisites

The tool auto-starts the server, but you can also run it manually:

```bash
opencode serve
```

## Installation

### Global Install (Recommended)

```bash
npm i -g /path/to/opencode-resume
```

Then add a shell alias to your `.zshrc` or `.bashrc`:

```bash
alias o='opencode-resume'
```

### Shell Alias (Direct)

If you prefer not to install globally, point directly at the built file:

```bash
alias o='node /path/to/opencode-resume/dist/index.js'
```

### Try Without Installing

```bash
npx /path/to/opencode-resume "my-session"
```

> **Note:** `npx` adds ~800ms of startup overhead. Fine for trying it out, but use one of the above for daily use.

### Local Development

```bash
cd /path/to/opencode-resume
npm install
npm run build
```

## Usage Examples

```bash
# Interactive picker - browse all sessions
o

# Resume or create "API Server"
o "API Server"

# All these resume the same session (normalized matching):
o "api_server"
o "api server"
o "API_SERVER"
o "api-server"

# Default to "general" if no title provided and no sessions exist
o
```

## How It Works

### Title Normalization

Titles are normalized before matching:
- Convert to lowercase
- Replace spaces and underscores with hyphens

**Examples:**
- `"Server Transpiler"` → `"server-transpiler"`
- `"server_transpiler"` → `"server-transpiler"`
- `"SERVER TRANSPILER"` → `"server-transpiler"`

### Session Filtering

- Only shows sessions in the current directory
- Excludes non-interactive subagent sessions (spawned by Task tool)
- Multiple sessions with same title are distinguished by timestamp and last message preview

### Server Management

`opencode-resume` automatically:
1. Checks if OpenCode server is running (port 4096)
2. Starts server in detached mode if needed
3. Waits for server to be ready (up to 10 seconds)
4. Never kills the server when exiting (it stays running for other sessions)

## Requirements

- **OpenCode** installed: `npm install -g opencode-ai`
- **Node.js** 18+ or Bun

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Testing Locally

```bash
cd ~/some-test-project
opencode-resume "test-session"

# Or using the built binary directly
node /path/to/opencode-resume/dist/index.js "test-session"
```

## Architecture

### Standalone CLI

This is a standalone CLI tool (not an OpenCode plugin) that uses the OpenCode SDK to:
- Search for existing sessions
- Create new sessions with custom titles
- Launch OpenCode with specific sessions

This approach is simpler and more reliable than using plugin hooks.

### Key Files

- **`src/index.ts`** - Main CLI entry point
- **`src/picker.ts`** - Interactive fuzzy-search TUI
- **`src/server.ts`** - Server management (start/wait for ready)
- **`src/search.ts`** - Session search and title normalization

## Troubleshooting

### Server Won't Start

If the server fails to start, you can manually start it:

```bash
opencode serve
```

Then run `opencode-resume` in another terminal.

### Session Not Found

Make sure you're in the correct directory. Sessions are matched by both title AND directory.

```bash
pwd  # Check current directory
opencode session list  # View all sessions
```

### Port Already in Use

If port 4096 is already in use by another application, OpenCode will try port 0 (random available port). In this case, you may need to manually configure the server port.

## License

MIT

## Author

towc
