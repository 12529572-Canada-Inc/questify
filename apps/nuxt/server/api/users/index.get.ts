import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const handler = defineEventHandler(async () => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
  });
  return users;
});

export default handler;

export type UsersResponse = Awaited<ReturnType<typeof handler>>;
