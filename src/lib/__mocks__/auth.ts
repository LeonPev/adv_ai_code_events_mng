import { vi } from 'vitest'
import type { Session } from 'next-auth'

export const getServerSession = vi.fn<[], Promise<Session | null>>()
export const authOptions = {}
