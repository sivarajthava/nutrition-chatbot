import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function saveMessageToDB(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  claims?: Array<{ claim_text: string; source: null }>
) {
  // Ensure session exists
  await prisma.session.upsert({
    where: { id: sessionId },
    update: { updatedAt: new Date() },
    create: { id: sessionId, title: "Chat Session" }
  });

  // Create message and optional claims atomically
  return prisma.message.create({
    data: {
      sessionId,
      role,
      content,
      claims: claims
        ? {
            create: claims.map((c) => ({
              claimText: c.claim_text,
              source: null
            }))
          }
        : undefined
    },
    include: {
      claims: true
    }
  });
}

export async function getSessionHistory(sessionId: string) {
  return prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    include: { claims: true }
  });
}
