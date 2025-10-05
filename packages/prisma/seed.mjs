import { PrismaClient } from '@prisma/client'
import fs from "fs";
import { Scrypt } from 'oslo/password'

const prisma = new PrismaClient()
const scrypt = new Scrypt()

async function main() {
  console.log("🌱 Seeding database...")

  // Hash the test password
  const hashedPassword = await scrypt.hash('testpassword123')
  console.log('Hashed password:', hashedPassword)

  // 🔒 Inline check — ensure correct format
  if (!hashedPassword.startsWith('$scrypt$')) {
    throw new Error(
      `❌ Invalid hash format. Expected "$scrypt$", got "${hashedPassword.slice(0, 20)}..." \n` +
      'Make sure you are importing { Scrypt } from "oslo/password".'
    )
  }

  console.log('Hashed password:', hashedPassword)

  const user = await prisma.user.create({
    data: {
      name: "Test User",
      email: "test@example.com",
      password: hashedPassword,
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
          create: quest.tasks.map((task) => ({
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
