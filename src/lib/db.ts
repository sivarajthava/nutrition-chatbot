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

export async function clearSessionHistory(sessionId: string) {
  return prisma.session.deleteMany({
    where: { id: sessionId }
  });
}

export async function listSessions() {
  return prisma.session.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" }
      }
    }
  });
}

export async function deleteSession(sessionId: string) {
  return prisma.session.delete({
    where: { id: sessionId }
  });
}

export interface FailureLogEntry {
  questionId: number;
  category: string;
  questionText: string;
  runNumber: number;
  responseText: string;
  failureTypes: string;
  notes?: string;
}

export async function saveFailureLogToDB(entry: FailureLogEntry) {
  return prisma.failureLog.create({
    data: {
      questionId: entry.questionId,
      category: entry.category,
      questionText: entry.questionText,
      runNumber: entry.runNumber,
      responseText: entry.responseText,
      failureTypes: entry.failureTypes,
      notes: entry.notes ?? null
    }
  });
}

export async function getFailureLogs() {
  return prisma.failureLog.findMany({
    orderBy: { createdAt: "desc" }
  });
}

