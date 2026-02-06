# opencode-resume

Resume or create OpenCode sessions by title. Never lose track of your project sessions again!

## What It Does

`opencode-resume` intelligently manages OpenCode sessions:

1. **Searches** for existing sessions with matching title in the current directory
2. **Resumes** the session if found, or **creates** a new one with the specified title
3. **Normalizes** titles for flexible matching (case-insensitive, spaces/underscores → hyphens)

## Prerequisites

**OpenCode server must be running:**

```bash
# In a separate terminal, start and keep running:
opencode serve
```

**Why?** OpenCode TUI instances (regular `opencode` command) use internal RPC and don't expose an HTTP server. The `opencode serve` command starts the HTTP server that this tool needs to communicate with.

**Tip:** Add this to your startup script or run it in a tmux/screen session.

## Installation

### Local Development

```bash
cd ~/git/github/towc/opencode-plugin-resume
npm install
npm run build
```

### Global Installation

```bash
cd ~/git/github/towc/opencode-plugin-resume
npm link
```

Now `opencode-resume` is available globally!

### Future: NPM Package

```bash
npm install -g opencode-resume
```

## Usage

**First, ensure the server is running:**
```bash
# Terminal 1: Start server (keep running)
opencode serve
```

**Then use the tool:**
```bash
# Terminal 2 (or use shell alias)
opencode-resume "session-title"
```

### Examples

```bash
# First time in a directory
opencode-resume "API Server"
# ✨ Creating new session: API Server

# Next time in the same directory
opencode-resume "api_server"
# 📂 Resuming session: API Server
# (Normalized "api_server" → "api-server" matches "API Server" → "api-server")

# Works with any variation
opencode-resume "api server"
opencode-resume "API_SERVER"
opencode-resume "api-server"
# All resume the same session!
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

### Multiple Matches

If multiple sessions with the same (normalized) title exist in the current directory, `opencode-resume` picks the most recently updated one.

### Server Management

`opencode-resume` automatically:
1. Checks if OpenCode server is running (port 4096)
2. Starts server in detached mode if needed
3. Waits for server to be ready
4. Never kills the server when exiting (it stays running for other sessions)

## Shell Alias

Add to your `.zshrc` or `.bashrc`:

```bash
# For local development
alias o='npx ~/git/github/towc/opencode-plugin-resume'

# For global installation
alias o='opencode-resume'
```

Then use it simply:

```bash
o "server-transpiler"
o "api-client"
o "database-migrations"
```

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
