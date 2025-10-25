import { PrismaClient } from '@prisma/client'
import { hashPassword } from 'shared/server'
import fs from 'fs';
import { ensureSuperAdmin, syncPrivilegesAndRoles } from './utils/accessControl'

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  console.log("🔐 Syncing roles & privileges...")
  await syncPrivilegesAndRoles(prisma)

  // Create an initial Super Admin user
  const user = await prisma.user.create({
    data: {
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: hashPassword('supersecurepassword'),
    },
})

  console.log("✅ User created:", user)

  await ensureSuperAdmin(prisma)

  // Load the merged seed data
  const data = JSON.parse(fs.readFileSync("./seed-data.json", "utf8"));

  for (const quest of data) {
    await prisma.quest.create({
      data: {
        ownerId: user.id,
        title: quest.title,
        goal: quest.goal ?? null,
        context: quest.context ?? null,
        constraints: quest.constraints ?? null,
        status: "active",
        tasks: {
          create: quest.tasks.map((task: { title: string; details: string; order: number }) => ({
            title: task.title,
            details: task.details,
            order: task.order,
            status: "todo",
          })),
        },
      },
    });

    console.log("✅ Quest created:", quest)
  }

  console.log("✅ Done seeding!");

}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
