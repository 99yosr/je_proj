import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from './session'
import { SessionData } from '../types/iron-session'

export async function getSession(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  return session
}

export async function requireAuth(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session.user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      ),
      user: null,
    }
  }

  return {
    error: null,
    user: session.user,
  }
}

export async function requireRole(
  req: NextRequest,
  allowedRoles: Array<'ADMIN' | 'RJE'>
) {
  const { error, user } = await requireAuth(req)
  
  if (error) return { error, user: null }
  
  if (!allowedRoles.includes(user!.role)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      ),
      user: null,
    }
  }

  return {
    error: null,
    user,
  }
}