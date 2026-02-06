# Quick Start Guide

## Prerequisites

**⚠️ IMPORTANT: Start OpenCode server first!**

```bash
# Terminal 1 - Start and keep running:
opencode serve
```

Regular `opencode` commands don't expose an HTTP server, so you need `opencode serve`.

## Installation (Local Development)

```bash
cd ~/git/github/towc/opencode-plugin-resume
npm install
npm run build
```

## Usage

### Step 1: Ensure server is running
```bash
# Check if server is running:
lsof -i :4096

# If not, start it:
opencode serve
```

### Step 2: Use the tool

#### Using npx (Development)

```bash
# In any directory
npx ~/git/github/towc/opencode-plugin-resume "session-title"
```

#### Using the shell alias

```bash
# Reload shell (first time only)
source ~/.zshrc

# Use 'o' command
o "my-project"
```

## Examples

```bash
# Create new session
o "api-server"

# Resume same session (case-insensitive, normalized)
o "API Server"
o "api_server"
o "api-server"
# All resume the same session!

# Different projects
cd ~/project-a && o "api-server"  # Session A
cd ~/project-b && o "api-server"  # Session B (different)
```

## What It Does

1. ✅ Searches for existing session with matching title in current directory
2. ✅ If found: Resumes the session
3. ✅ If not found: Creates new session with that title
4. ✅ Automatically starts OpenCode server if needed (detached mode)
5. ✅ Title matching is case-insensitive and normalizes spaces/underscores

## Key Features

- **Smart matching**: "API Server", "api_server", "api-server" all match
- **Directory-scoped**: Same title in different directories = different sessions
- **Server management**: Starts server automatically, keeps it running
- **Most recent**: If multiple matches, uses most recently updated
- **Safe**: Never kills the server or other sessions

## Requirements

- Node.js 18+ or Bun
- OpenCode installed: `npm install -g opencode-ai`

## Testing

```bash
cd ~/git/github/towc/opencode-plugin-resume
./test-basic.sh
```

## Help

```bash
# Show usage
npx ~/git/github/towc/opencode-plugin-resume

# Or with alias
o
```

## Common Commands

```bash
# Build
npm run build

# Watch mode (auto-rebuild)
npm run dev

# Test locally
npx . "test-session"

# View all sessions
opencode session list

# Check if server running
lsof -i :4096
```

## Documentation

- **README.md** - Full user documentation
- **TESTING.md** - Testing guide with scenarios
- **DEVELOPMENT.md** - Development guide and architecture
- **QUICKSTART.md** - This file

## Troubleshooting

**"Server failed to start"**
```bash
opencode serve  # Start manually
```

**"Session not found"**
```bash
pwd                    # Check you're in right directory
opencode session list  # View all sessions
```

**npx is slow**
```bash
npm link  # Install globally for faster access
```

## Next Steps

1. Try it: `o "test-session"`
2. Read TESTING.md for more scenarios
3. Read DEVELOPMENT.md if you want to contribute
4. Enjoy never losing track of your sessions! 🎉
