import type { Session } from 'next-auth'

const EXPIRES = new Date(Date.now() + 3_600_000).toISOString()

export const sessionAs = {
  admin: (): Session => ({
    expires: EXPIRES,
    user: { id: 'admin-id', email: 'admin@ccms.local', name: 'Hadas Admin', role: 'ADMIN' },
  }),
  operator: (): Session => ({
    expires: EXPIRES,
    user: { id: 'op-id', email: 'operator@ccms.local', name: 'Yossi Operator', role: 'OPERATOR' },
  }),
  customer: (): Session => ({
    expires: EXPIRES,
    user: { id: 'cust-id', email: 'customer@ccms.local', name: 'Maya Customer', role: 'CUSTOMER' },
  }),
}
