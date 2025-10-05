import { PrismaClient, Task } from '@prisma/client'
import fs, { stat } from "fs";

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Test User",
      password: "testpassword123", // Add a suitable password here
    }
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
          create: quest.tasks.map((task: Task) => ({
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
