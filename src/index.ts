#!/usr/bin/env node
import { createOpencodeClient } from '@opencode-ai/sdk/v2'
import { spawn } from 'child_process'
import { ensureServerRunning } from './server.js'
import { findSession } from './search.js'
import { showPicker } from './picker.js'

async function launchSession(sessionID: string, cwd: string): Promise<never> {
  const child = spawn('opencode', ['--session', sessionID], {
    stdio: 'inherit',
    cwd
  })
  
  return new Promise((resolve, reject) => {
    child.on('exit', (code) => {
      process.exit(code ?? 0)
    })
    
    child.on('error', (error) => {
      console.error('❌ Failed to start OpenCode:', error.message)
      process.exit(1)
    })
  })
}

async function createSession(title: string, cwd: string): Promise<string> {
  const client = createOpencodeClient({
    baseUrl: 'http://localhost:4096'
  })
  
  console.log(`✨ Creating new session: ${title}`)
  const response = await client.session.create({
    title,
    directory: cwd
  })
  
  if (!response.data?.id) {
    console.error('❌ Failed to create session')
    if (response.error) {
      console.error('   Error details:', response.error)
    }
    process.exit(1)
  }
  
  return response.data.id
}

async function main() {
  const titleArg = process.argv[2]
  const cwd = process.cwd()
  
  try {
    // Ensure OpenCode server is running
    try {
      await ensureServerRunning()
    } catch (error) {
      console.error('❌ Failed to start or connect to OpenCode server')
      console.error('   Please start the server manually: opencode serve')
      if (error instanceof Error) {
        console.error('   Error:', error.message)
      }
      process.exit(1)
    }
    
    let sessionID: string
    
    if (titleArg) {
      // Title provided - use existing behavior
      const existingSession = await findSession(titleArg, cwd)
      
      if (existingSession) {
        console.log(`📂 Resuming session: ${existingSession.title}`)
        sessionID = existingSession.id
      } else {
        sessionID = await createSession(titleArg, cwd)
      }
    } else {
      // No title - show interactive picker
      const result = await showPicker(cwd)
      
      if (result.type === 'existing') {
        sessionID = result.sessionId!
      } else {
        sessionID = await createSession(result.title!, cwd)
      }
    }
    
    console.log('')
    await launchSession(sessionID, cwd)
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
