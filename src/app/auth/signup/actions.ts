'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

type SignUpResult = { error: string } | { success: true }

export async function signUpAction(formData: FormData): Promise<SignUpResult> {
  const fullName = (formData.get('fullName') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!fullName) return { error: 'Full name is required.' }
  if (!email) return { error: 'Email is required.' }
  if (!password || password.length < 8) return { error: 'Password must be at least 8 characters.' }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'An account with this email already exists.' }

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { email, passwordHash, fullName, role: 'CUSTOMER', status: 'ACTIVE' },
  })

  return { success: true }
}
