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

> my-session          10:30 AM  abc123de
  api-server          yesterday def456gh
  database-work       3d ago    ghi789jk
```

**Controls:**
- **Type** - Fuzzy search sessions
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

### Local Development

```bash
cd ~/git/github/towc/opencode-plugin-resume
npm install
npm run build
```

### Shell Alias (Recommended)

Add to your `.zshrc` or `.bashrc`:

```bash
alias o='npx ~/git/github/towc/opencode-plugin-resume'
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
- Multiple sessions with same title are distinguished by timestamp and ID

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
# Using npx with relative path
cd ~/some-test-project
npx ~/git/github/towc/opencode-plugin-resume "test-session"

# Or using the built binary directly
cd ~/git/github/towc/opencode-plugin-resume
./dist/index.js "test-session"
```

## Architecture

### Not a Plugin

Despite the repository name, this is **not** an OpenCode plugin. It's a standalone CLI tool that uses the OpenCode SDK to:
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
