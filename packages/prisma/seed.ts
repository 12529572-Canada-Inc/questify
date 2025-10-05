import { PrismaClient } from '@prisma/client'
import fs from "fs";

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create a test user
  const user = await prisma.user.create({
    data: {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    },
  })

  console.log("✅ User created:", user)

  // Load the merged seed data
  const data = JSON.parse(fs.readFileSync("./seed-data.json", "utf8"));

  for (const quest of data) {
    await prisma.quest.create({
      data: {
        ownerId: user.id,
        title: quest.title,
        description: quest.description,
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
