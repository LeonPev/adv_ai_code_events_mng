import type { Prisma } from "@prisma/client"

export interface AuditLogInput {
  action: string
  actorId: string
  targetId: string
  targetType: string
  metadata?: Record<string, unknown>
}

/** Writes one audit log row. Pass a transaction client to keep it atomic with the mutation it records. */
export async function writeAuditLog(
  client: Prisma.TransactionClient,
  input: AuditLogInput
): Promise<void> {
  await client.auditLog.create({
    data: {
      action: input.action,
      actorId: input.actorId,
      targetId: input.targetId,
      targetType: input.targetType,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  })
}
