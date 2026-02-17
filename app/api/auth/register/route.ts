import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs' // bcrypt requires Node

type RegisterBody = {
  email: string
  password: string
  name: string
  role?: 'RJE' | 'ADMIN'
  nbrmembres?: number
}

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: User registration
 *     description: Creates a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [RJE, ADMIN]
 *                 default: RJE
 *               nbrmembres:
 *                 type: integer
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Email already registered
 *       500:
 *         description: Server error
 */
export async function POST(req: NextRequest) {
  const body: RegisterBody = await req.json()
  const { email, password, name, role, nbrmembres } = body

  // Basic validation
  if (!email || !password || !name) {
    return NextResponse.json(
      { error: 'Missing fields' },
      { status: 400 }
    )
  }

  // Prevent role escalation
  const safeRole = role ?? 'RJE'


  // Check for existing user
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return NextResponse.json(
      { error: 'Email already registered' },
      { status: 409 }
    )
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: safeRole,
    },
  })

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    },
    { status: 201 }
  )
}
