# Development Guide

## Project Structure

```
opencode-resume/
├── src/
│   ├── index.ts       # Main CLI entry point
│   ├── server.ts      # Server management (ensure running, wait for ready)
│   └── search.ts      # Session search and title normalization
├── dist/              # Compiled JavaScript (gitignored)
├── node_modules/      # Dependencies (gitignored)
├── test-basic.sh      # Basic smoke tests
├── package.json       # NPM package configuration
├── tsconfig.json      # TypeScript configuration
├── README.md          # User documentation
├── TESTING.md         # Testing guide
└── DEVELOPMENT.md     # This file
```

## Development Workflow

### Setup

```bash
cd /path/to/opencode-resume
npm install
```

### Building

```bash
# One-time build
npm run build

# Watch mode (rebuilds on file changes)
npm run dev
```

### Testing During Development

```bash
# After building, test directly
node dist/index.js "test-session"

# Or use npx (slower, but no install needed)
npx . "test-session"

# Or test the smoke tests
./test-basic.sh
```

### Making Changes

1. Edit files in `src/`
2. Run `npm run build` (or use watch mode)
3. Test with `node dist/index.js "test-title"` or `npx . "test-title"`
4. Commit when ready

## Code Organization

### `src/index.ts` - Main Entry Point

**Responsibilities:**
- Parse command-line arguments
- Ensure server is running
- Search for existing session or create new one
- Launch OpenCode TUI with the session

**Key Functions:**
- `main()` - Entry point, orchestrates the flow

### `src/server.ts` - Server Management

**Responsibilities:**
- Check if OpenCode server is running
- Start server in detached mode if needed
- Wait for server to be ready

**Key Functions:**
- `isServerRunning()` - Check server availability
- `startServer()` - Launch detached server process
- `waitForServer(timeout)` - Poll until server is ready
- `ensureServerRunning()` - Public API, handles all server management

**Important Details:**
- Server is spawned with `detached: true` and `stdio: 'ignore'`
- Process is unref'd to prevent parent process hanging
- Server runs independently and won't be killed when CLI exits

### `src/search.ts` - Session Search

**Responsibilities:**
- Normalize session titles for comparison
- Search for sessions matching title and directory
- Return most recent match if multiple found

**Key Functions:**
- `normalizeTitle(title)` - Convert to lowercase, replace spaces/underscores with hyphens
- `findSession(title, directory)` - Search and return matching session

**Normalization Rules:**
- Case-insensitive: `"API Server"` → `"api server"`
- Spaces to hyphens: `"api server"` → `"api-server"`
- Underscores to hyphens: `"api_server"` → `"api-server"`

## OpenCode SDK Usage

We use the v2 SDK from `@opencode-ai/sdk/v2`:

```typescript
import { createOpencodeClient } from '@opencode-ai/sdk/v2'

const client = createOpencodeClient({
  baseUrl: 'http://localhost:4096'
})

// List sessions
const sessions = await client.session.list({
  directory: '/path/to/project',
  limit: 1000
})
// Returns: { data: Session[], error?: any }

// Create session
const newSession = await client.session.create({
  title: 'My Session',
  directory: '/path/to/project'
})
// Returns: { data: { id: string, ... }, error?: any }
```

## TypeScript Configuration

Key compiler options in `tsconfig.json`:

- **target**: ES2022 (modern JavaScript)
- **module**: ES2022 (ESM modules)
- **moduleResolution**: bundler (modern resolution)
- **strict**: true (strict type checking)

## Adding New Features

### Example: Add fuzzy matching

1. **Update `src/search.ts`**:
```typescript
import fuzzysort from 'fuzzysort'

export async function findSession(title: string, directory: string) {
  // ... existing code ...
  
  // If exact match fails, try fuzzy match
  if (matches.length === 0) {
    const fuzzyResults = fuzzysort.go(normalized, sessions.map(s => ({
      title: normalizeTitle(s.title),
      session: s
    })), { key: 'title' })
    
    if (fuzzyResults.length > 0) {
      return fuzzyResults[0].obj.session
    }
  }
  
  // ... rest of code ...
}
```

2. **Install dependency**:
```bash
npm install fuzzysort
npm install -D @types/fuzzysort
```

3. **Build and test**:
```bash
npm run build
npx . "serv"  # Should match "server-transpiler"
```

### Example: Add session creation hooks

1. **Create `src/hooks.ts`**:
```typescript
export type SessionHook = {
  onBeforeCreate?: (title: string, directory: string) => Promise<void>
  onAfterCreate?: (sessionID: string, title: string) => Promise<void>
}

export const hooks: SessionHook = {}
```

2. **Update `src/index.ts`**:
```typescript
import { hooks } from './hooks.js'

// Before creating session
if (hooks.onBeforeCreate) {
  await hooks.onBeforeCreate(title, cwd)
}

// After creating session
if (hooks.onAfterCreate) {
  await hooks.onAfterCreate(sessionID, title)
}
```

## Publishing to NPM (Future)

When ready to publish:

1. **Update version**:
```bash
npm version patch  # or minor, or major
```

2. **Build**:
```bash
npm run build
```

3. **Publish**:
```bash
npm publish
```

4. **Users can install**:
```bash
npm install -g opencode-resume
```

## Debugging

### Enable verbose logging

Add to `src/index.ts`:

```typescript
const DEBUG = process.env.DEBUG === '1'

function log(...args: any[]) {
  if (DEBUG) console.log('[DEBUG]', ...args)
}
```

Then run:
```bash
DEBUG=1 npx . "test-session"
```

### Check SDK responses

Add after API calls:

```typescript
const response = await client.session.list({ directory: cwd })
console.log('SDK Response:', JSON.stringify(response, null, 2))
```

### Test server management

```typescript
// In src/server.ts, add logging
export async function ensureServerRunning(): Promise<void> {
  console.log('[SERVER] Checking if server is running...')
  if (await isServerRunning()) {
    console.log('[SERVER] Server already running')
    return
  }
  console.log('[SERVER] Starting server...')
  // ... rest of code ...
}
```

## Common Issues

### TypeScript errors after SDK update

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Server won't start

```bash
# Check if port 4096 is in use
lsof -i :4096

# Try starting manually
opencode serve
```

### npx is using old version

```bash
# Clear npx cache
npx clear-npx-cache

# Or specify current directory explicitly
npx . "test-session"
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/fuzzy-matching

# Make changes
# ... edit files ...

# Build and test
npm run build
./test-basic.sh

# Commit
git add -A
git commit -m "Add fuzzy matching for session titles"

# Merge to main
git checkout main
git merge feature/fuzzy-matching
```

## Code Style

- Use TypeScript strict mode
- Prefer `async/await` over promises
- Use descriptive variable names
- Add comments for complex logic
- Keep functions small and focused
- Export types when used across files

## Future Improvements

Ideas for future enhancements:

1. **Fuzzy matching** - Match "serv" to "server-transpiler"
2. **Interactive selection** - Show menu when multiple matches
3. **Session tags** - Tag sessions for better organization
4. **Remote servers** - Support connecting to remote OpenCode servers
5. **Session templates** - Pre-configured session setups
6. **Shell completion** - Tab completion for session titles
7. **Session history** - Track recent sessions across directories
8. **Aliases** - Short names for frequently used sessions

## Resources

- [OpenCode Source Code](https://github.com/anomalyco/opencode)
- [OpenCode SDK Documentation](https://github.com/anomalyco/opencode/tree/main/packages/sdk)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Node.js spawn Documentation](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options)
