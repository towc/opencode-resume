import { createOpencodeClient } from '@opencode-ai/sdk/v2'
import type { Session } from '@opencode-ai/sdk/v2'

export interface PickerResult {
  type: 'existing' | 'new'
  sessionId?: string
  title?: string
}

export interface SessionWithPreview extends Session {
  lastUserMessage?: string
}

function isInteractiveSession(session: Session): boolean {
  // Filter out non-interactive subagent sessions (they have restricted permissions)
  if (!session.permission) return true
  return !session.permission.some(p => 
    p.permission === 'todowrite' && p.action === 'deny'
  )
}

function formatTimestamp(ms: number): string {
  const date = new Date(ms)
  const now = new Date()
  const diffMs = now.getTime() - ms
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  } else if (diffDays === 1) {
    return 'yesterday'
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

function getTerminalWidth(): number {
  return process.stdout.columns || 80
}

function truncateWithEllipsis(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  if (maxLen <= 3) return text.slice(0, maxLen)
  return text.slice(0, maxLen - 3) + '...'
}

function formatSession(session: SessionWithPreview, selected: boolean, maxTitleLen: number): string {
  const cursor = selected ? '>' : ' '
  const timestamp = formatTimestamp(session.time.updated)
  const paddedTitle = session.title.padEnd(maxTitleLen)
  
  // Calculate available space for preview
  // Format: "> title  timestamp  preview"
  const termWidth = getTerminalWidth()
  const fixedParts = cursor.length + 1 + maxTitleLen + 2 + timestamp.length + 2 // cursor + space + title + 2 spaces + timestamp + 2 spaces
  const availableForPreview = termWidth - fixedParts - 2 // leave some margin
  
  let preview = ''
  if (session.lastUserMessage && availableForPreview > 10) {
    // Clean up the message (single line, no extra whitespace)
    const cleaned = session.lastUserMessage.replace(/\s+/g, ' ').trim()
    preview = truncateWithEllipsis(cleaned, availableForPreview)
  }
  
  if (preview) {
    return `${cursor} ${paddedTitle}  \x1b[2m${timestamp}  ${preview}\x1b[0m`
  }
  return `${cursor} ${paddedTitle}  \x1b[2m${timestamp}\x1b[0m`
}

interface MessageWithParts {
  info: { id: string; role: string }
  parts: Array<{ type: string; text?: string }>
}

export async function getSessions(directory: string): Promise<SessionWithPreview[]> {
  const client = createOpencodeClient({
    baseUrl: 'http://localhost:4096'
  })
  
  const response = await client.session.list({
    directory,
    limit: 100
  })
  
  if (!response.data) return []
  
  // Filter to current directory, exclude subagents and empty sessions, and sort by most recent
  const sessions = response.data
    .filter((s: Session) => s.directory === directory && isInteractiveSession(s) && s.time.created !== s.time.updated)
    .sort((a, b) => b.time.updated - a.time.updated)
  
  // Fetch last user message for each session (in parallel, limited)
  const sessionsWithPreviews: SessionWithPreview[] = await Promise.all(
    sessions.slice(0, 20).map(async (session): Promise<SessionWithPreview> => {
      try {
        const messagesRes = await client.session.messages({
          sessionID: session.id,
          directory,
          limit: 10
        })
        
        if (messagesRes.data) {
          // Response is array of { info, parts } in chronological order (oldest first)
          // Iterate in reverse to find the latest user message
          const messages = messagesRes.data as MessageWithParts[]
          for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i]
            if (msg.info.role === 'user') {
              // Find first text part
              const textPart = msg.parts.find(p => p.type === 'text' && p.text)
              if (textPart?.text) {
                return { ...session, lastUserMessage: textPart.text }
              }
            }
          }
        }
      } catch {
        // Ignore errors fetching messages
      }
      return session
    })
  )
  
  // Add remaining sessions without previews
  return [...sessionsWithPreviews, ...sessions.slice(20)]
}

function fuzzyMatch(query: string, text: string): boolean {
  const lowerQuery = query.toLowerCase()
  const lowerText = text.toLowerCase()
  
  let qi = 0
  for (let ti = 0; ti < lowerText.length && qi < lowerQuery.length; ti++) {
    if (lowerText[ti] === lowerQuery[qi]) {
      qi++
    }
  }
  return qi === lowerQuery.length
}

function fuzzyScore(query: string, text: string): number {
  const lowerQuery = query.toLowerCase()
  const lowerText = text.toLowerCase()
  
  let score = 0
  let qi = 0
  let consecutive = 0
  
  for (let ti = 0; ti < lowerText.length && qi < lowerQuery.length; ti++) {
    if (lowerText[ti] === lowerQuery[qi]) {
      qi++
      consecutive++
      score += consecutive * 2
      // Bonus for matching at start
      if (ti === 0) score += 10
      // Bonus for matching after separator
      if (ti > 0 && /[\s\-_]/.test(lowerText[ti - 1])) score += 5
    } else {
      consecutive = 0
    }
  }
  return qi === lowerQuery.length ? score : 0
}

function filterSessions(sessions: Session[], query: string): Session[] {
  if (!query) return sessions
  
  return sessions
    .filter(s => fuzzyMatch(query, s.title))
    .sort((a, b) => fuzzyScore(query, b.title) - fuzzyScore(query, a.title))
}

function clearLines(count: number): void {
  for (let i = 0; i < count; i++) {
    process.stdout.write('\x1b[1A\x1b[2K')
  }
}

function readKey(): Promise<string> {
  return new Promise((resolve) => {
    const wasRaw = process.stdin.isRaw
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.once('data', (data) => {
      process.stdin.setRawMode(wasRaw)
      process.stdin.pause()
      resolve(data.toString())
    })
  })
}

export async function showPicker(directory: string): Promise<PickerResult> {
  const allSessions = await getSessions(directory)
  
  if (allSessions.length === 0) {
    // No sessions, prompt for title inline
    console.log('No sessions in this directory.')
    console.log('Enter title for new session (or press enter for "general"):')
    let title = ''
    process.stdout.write('> ')
    
    while (true) {
      const key = await readKey()
      if (key === '\r' || key === '\n') {
        console.log('')
        return { type: 'new', title: title || 'general' }
      } else if (key === '\x7f' || key === '\b') {
        if (title.length > 0) {
          title = title.slice(0, -1)
          process.stdout.write('\b \b')
        }
      } else if (key === '\x03') {
        process.exit(0)
      } else if (key.length === 1 && key >= ' ') {
        title += key
        process.stdout.write(key)
      }
    }
  }
  
  let query = ''
  let selectedIndex = 0
  let linesDrawn = 0
  const maxVisible = 10
  
  // Calculate max title length for alignment
  const maxTitleLen = Math.max(...allSessions.map(s => s.title.length))
  
  function getFiltered(): Session[] {
    return filterSessions(allSessions, query)
  }
  
  function draw() {
    if (linesDrawn > 0) {
      clearLines(linesDrawn)
    }
    
    const filtered = getFiltered()
    const lines: string[] = []
    
    // Search input at top
    if (query) {
      lines.push(` /${query}`)
    } else {
      lines.push('\x1b[2m /   type to search\x1b[0m')
    }
    lines.push('\x1b[2m↑↓ navigate | enter select | ^n new | esc quit\x1b[0m')
    lines.push('')
    
    if (filtered.length === 0) {
      if (query) {
        lines.push(`  \x1b[33mNo matches. Press ^n or enter to create "${query}"\x1b[0m`)
      } else {
        lines.push('  \x1b[2mNo sessions\x1b[0m')
      }
    } else {
      const visibleCount = Math.min(filtered.length, maxVisible)
      const start = Math.max(0, Math.min(selectedIndex - Math.floor(visibleCount / 2), filtered.length - visibleCount))
      const end = Math.min(filtered.length, start + visibleCount)
      
      for (let i = start; i < end; i++) {
        const line = formatSession(filtered[i], i === selectedIndex, maxTitleLen)
        lines.push(i === selectedIndex ? `\x1b[36m${line}\x1b[0m` : line)
      }
      
      if (filtered.length > maxVisible) {
        lines.push(`\x1b[2m  ... ${filtered.length} matches\x1b[0m`)
      }
    }
    
    process.stdout.write(lines.join('\n') + '\n')
    linesDrawn = lines.length
  }
  
  draw()
  
  while (true) {
    const key = await readKey()
    const filtered = getFiltered()
    
    if (key === '\x1b[A') {
      // Up arrow
      if (filtered.length > 0) {
        selectedIndex = Math.max(0, selectedIndex - 1)
      }
      draw()
    } else if (key === '\x1b[B') {
      // Down arrow
      if (filtered.length > 0) {
        selectedIndex = Math.min(filtered.length - 1, selectedIndex + 1)
      }
      draw()
    } else if (key === '\x0e') {
      // Ctrl+N - create new session with query as title
      clearLines(linesDrawn)
      return { type: 'new', title: query || 'general' }
    } else if (key === '\r' || key === '\n') {
      // Enter - select session or create new if no matches
      clearLines(linesDrawn)
      if (filtered.length > 0 && selectedIndex < filtered.length) {
        return { type: 'existing', sessionId: filtered[selectedIndex].id }
      } else {
        return { type: 'new', title: query || 'general' }
      }
    } else if (key === '\x1b' || key === '\x03') {
      // Escape or Ctrl+C - quit
      clearLines(linesDrawn)
      process.exit(0)
    } else if (key === '\x7f' || key === '\b') {
      // Backspace
      if (query.length > 0) {
        query = query.slice(0, -1)
        selectedIndex = 0
      }
      draw()
    } else if (key.length === 1 && key >= ' ') {
      // Regular character - add to search
      query += key
      selectedIndex = 0
      draw()
    }
  }
}
