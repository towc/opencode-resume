import { spawn } from 'child_process'
import { createOpencodeClient } from '@opencode-ai/sdk/v2'

/**
 * Check if OpenCode server is running by attempting to connect
 */
async function isServerRunning(): Promise<boolean> {
  try {
    const client = createOpencodeClient({ 
      baseUrl: 'http://localhost:4096',
    })
    await client.session.list()
    return true
  } catch {
    return false
  }
}

/**
 * Wait for server to be ready by polling connection
 */
async function waitForServer(timeoutMs: number): Promise<void> {
  const startTime = Date.now()
  const client = createOpencodeClient({ 
    baseUrl: 'http://localhost:4096',
  })
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      await client.session.list()
      return // Server is ready
    } catch {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  throw new Error('Server failed to start within timeout')
}

/**
 * Start OpenCode server in detached mode
 */
function startServer(): void {
  console.log('Starting OpenCode server...')
  
  const child = spawn('opencode', ['serve'], {
    detached: true,      // Run independently
    stdio: 'ignore',     // Don't pipe output
    shell: false
  })
  
  child.unref()  // Don't keep parent process alive
}

/**
 * Ensure OpenCode server is running, starting it if necessary
 */
export async function ensureServerRunning(): Promise<void> {
  console.log('Checking if OpenCode server is running...')
  if (await isServerRunning()) {
    console.log('Server is already running')
    return // Server already running
  }
  
  console.log('Server not running, starting it...')
  // Start server
  startServer()
  
  // Wait for server to be ready
  console.log('Waiting for server to be ready...')
  await waitForServer(5000)
  console.log('Server started successfully')
}
