# Testing Guide for opencode-resume

## Quick Start

```bash
# Run basic smoke tests
./test-basic.sh

# Test with npx (recommended for development)
npx . "test-session"
```

## Manual Testing Scenarios

### 1. Basic Functionality

```bash
cd ~/some-test-directory

# First run - creates new session
npx ~/git/github/towc/opencode-plugin-resume "test-session"
# Expected: Creates session with title "test-session"
# Action: Exit OpenCode (Ctrl+C or quit)

# Second run - resumes session
npx ~/git/github/towc/opencode-plugin-resume "test-session"
# Expected: Resumes the same session
```

### 2. Title Normalization

```bash
# All these should resume the same session:
npx ~/git/github/towc/opencode-plugin-resume "test session"
npx ~/git/github/towc/opencode-plugin-resume "test_session"
npx ~/git/github/towc/opencode-plugin-resume "TEST_SESSION"
npx ~/git/github/towc/opencode-plugin-resume "Test Session"
```

### 3. Using the Shell Alias

```bash
# Reload shell configuration
source ~/.zshrc

# Use the 'o' command
o "my-project"
o "api-server"
o "database-migrations"
```

### 4. Server Management

```bash
# Test 1: Server not running
# Kill any opencode serve processes first (CAREFUL!)
pkill -f "opencode serve"

# Run opencode-resume
npx ~/git/github/towc/opencode-plugin-resume "test"
# Expected: Starts server automatically, then creates/resumes session

# Test 2: Server already running
# Server should stay running from previous test
npx ~/git/github/towc/opencode-plugin-resume "test"
# Expected: Reuses existing server
```

### 5. Multiple Sessions

```bash
cd ~/project-a
o "project-a-session"
# Exit

cd ~/project-b
o "project-b-session"
# Exit

# Now resume each
cd ~/project-a
o "project-a-session"  # Should resume project-a session
# Exit

cd ~/project-b
o "project-b-session"  # Should resume project-b session
```

### 6. Error Cases

```bash
# No title provided
npx ~/git/github/towc/opencode-plugin-resume
# Expected: Shows usage message

# Invalid directory
cd /nonexistent/directory 2>/dev/null || echo "Can't cd there"
# Expected: Error message
```

## Edge Cases

### Multiple Sessions with Same Title

If you manually create multiple sessions with the same title in the same directory:

```bash
o "duplicate"
# Creates first session
# Manually rename in UI to "test"

# Create another session, rename to "test"

# Run again
o "test"
# Expected: Resumes most recently updated session
# Shows message: "Found 2 sessions matching "test", using most recent"
```

### Different Directories

Sessions are scoped to directories:

```bash
cd ~/project-a
o "api-server"
# Creates/resumes session in ~/project-a

cd ~/project-b
o "api-server"
# Creates/resumes DIFFERENT session in ~/project-b
```

## Safety Checks

### ✅ Server Won't Be Killed
- The server runs detached
- Multiple OpenCode TUI instances can run simultaneously
- Exiting `opencode-resume` won't kill the server

### ✅ Sessions Are Safe
- Creating/resuming sessions doesn't affect other running sessions
- Each TUI process is independent

## Debugging

### Check if server is running
```bash
lsof -i :4096
# or
pgrep -f "opencode serve"
```

### View all sessions
```bash
opencode session list
```

### Check session storage
```bash
ls -la ~/.local/share/opencode/storage/session/
```

### Enable debug output
```bash
# Add to the opencode-resume code if needed
# For now, check OpenCode server logs
```

## Performance

- **Server startup**: ~1-2 seconds
- **Session search**: <100ms (for <1000 sessions)
- **Session creation**: ~500ms
- **OpenCode TUI launch**: ~1-2 seconds

## Known Limitations

1. **Title must be set on creation**: The SDK doesn't support setting title after creation through the CLI, only through the API
2. **Server port**: Assumes port 4096 (OpenCode's default)
3. **Local only**: Only works with localhost server, not remote servers
4. **Node.js required**: Needs Node.js 18+ (or Bun)

## Troubleshooting

### "Failed to create session"
- Check if OpenCode server is running: `opencode serve`
- Try manually: `opencode` to verify OpenCode works

### "Server failed to start within timeout"
- Server might be slow to start
- Try increasing timeout in `src/server.ts` (currently 5000ms)

### "Session not found"
- Check you're in the correct directory: `pwd`
- List sessions: `opencode session list`
- Remember: Title matching is normalized (case-insensitive, spaces/underscores → hyphens)

### npx is slow
- First run downloads packages (slow)
- Subsequent runs use cache (fast)
- For best performance, use `npm link` for global installation

## CI/CD Testing (Future)

When ready to add automated tests:

```bash
# Unit tests (with mocking)
npm test

# Integration tests (requires OpenCode installed)
npm run test:integration

# E2E tests (full flow)
npm run test:e2e
```
