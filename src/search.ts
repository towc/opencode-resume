import { createOpencodeClient } from '@opencode-ai/sdk/v2'
import type { Session } from '@opencode-ai/sdk/v2'

/**
 * Check if session is interactive (not a subagent)
 */
function isInteractiveSession(session: Session): boolean {
  if (!session.permission) return true
  return !session.permission.some(p => 
    p.permission === 'todowrite' && p.action === 'deny'
  )
}

/**
 * Normalize session title for comparison
 * - Convert to lowercase
 * - Replace spaces and underscores with hyphens
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\s_]/g, '-')
}

/**
 * Find existing session by title in the specified directory
 * Uses normalized title matching (case-insensitive, spaces/underscores → hyphens)
 * If multiple matches exist, returns the most recently updated one
 * Excludes non-interactive subagent sessions
 */
export async function findSession(
  title: string,
  directory: string
): Promise<Session | null> {
  const normalized = normalizeTitle(title)
  
  const client = createOpencodeClient({
    baseUrl: 'http://localhost:4096'
  })
  
  try {
    // Get all sessions
    const response = await client.session.list({ 
      directory,
      limit: 1000  // Reasonable limit
    })
    
    if (!response.data || response.data.length === 0) {
      return null
    }
    
    // Find exact match (after normalization), excluding subagents
    const matches = response.data.filter((s: Session) => 
      s.directory === directory &&
      normalizeTitle(s.title) === normalized &&
      isInteractiveSession(s)
    )
    
    if (matches.length === 0) {
      return null
    }
    
    // Sort by most recently updated
    matches.sort((a, b) => b.time.updated - a.time.updated)
    
    if (matches.length > 1) {
      console.log(`Found ${matches.length} sessions matching "${title}", using most recent`)
    }
    
    return matches[0]
  } catch (error) {
    throw new Error(`Failed to search sessions: ${error instanceof Error ? error.message : error}`)
  }
}
