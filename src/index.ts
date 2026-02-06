#!/usr/bin/env node
import { createOpencodeClient } from '@opencode-ai/sdk/v2'
import { spawn } from 'child_process'
import { ensureServerRunning } from './server.js'
import { findSession } from './search.js'

async function main() {
  const title = process.argv[2]
  
  if (!title) {
    console.error('Usage: opencode-resume <session-title>')
    console.error('')
    console.error('Example:')
    console.error('  opencode-resume "server-transpiler"')
    console.error('  opencode-resume "API Server"')
    console.error('')
    console.error('The title is case-insensitive and normalizes spaces/underscores to hyphens.')
    process.exit(1)
  }

  const cwd = process.cwd()
  
  try {
    // Ensure OpenCode server is running
    try {
      await ensureServerRunning()
    } catch (error) {
      console.error('❌ Failed to start or connect to OpenCode server')
      console.error('   Please start the server manually: opencode serve')
      console.error('   Or run in another terminal and keep it running.')
      if (error instanceof Error) {
        console.error('   Error:', error.message)
      }
      process.exit(1)
    }
    
    // Create SDK client
    const client = createOpencodeClient({
      baseUrl: 'http://localhost:4096'
    })
    
    // Search for existing session
    const existingSession = await findSession(title, cwd)
    
    let sessionID: string
    
    if (existingSession) {
      console.log(`📂 Resuming session: ${existingSession.title}`)
      console.log(`   ID: ${existingSession.id}`)
      sessionID = existingSession.id
    } else {
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
        console.error('   Response:', JSON.stringify(response, null, 2))
        process.exit(1)
      }
      
      sessionID = response.data.id
      console.log(`   Created with ID: ${sessionID}`)
    }
    
    console.log('') // Blank line before launching
    
    // Launch OpenCode TUI with the session
    const child = spawn('opencode', ['--session', sessionID], {
      stdio: 'inherit',  // Attach to current terminal
      cwd
    })
    
    child.on('exit', (code) => {
      process.exit(code ?? 0)
    })
    
    child.on('error', (error) => {
      console.error('❌ Failed to start OpenCode:', error.message)
      process.exit(1)
    })
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
