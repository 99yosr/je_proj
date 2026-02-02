import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from './session'
import { SessionData } from '../types/iron-session'

export async function getSession(req: NextRequest) {
  const res = new NextResponse()
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  return { session, res }
}

export async function requireAuth(req: NextRequest) {
  const res = new NextResponse()
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  
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
    session,
  }
}

export async function requireRole(
  req: NextRequest,
  allowedRoles: Array<'ADMIN' | 'RJE'>
) {
  const res = new NextResponse()
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  
  if (!session.user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      ),
      user: null,
    }
  }
  
  if (!allowedRoles.includes(session.user.role)) {
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
    user: session.user,
    session,
  }
}