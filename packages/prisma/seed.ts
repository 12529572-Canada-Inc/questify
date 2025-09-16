import { PrismaClient } from '@prisma/client'

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
    }
  })

  // Create a quest
  const quest = await prisma.quest.create({
    data: {
      title: "Climb Mt. Everest",
      description: "Prepare, train, and conquer the summit!",
      ownerId: user.id,
      status: "active",
      tasks: {
        create: [
          { title: "Research climb logistics", order: 0 },
          { title: "Train for endurance", order: 1 },
          { title: "Acquire climbing gear", order: 2 },
          { title: "Book permits and travel", order: 3 }
        ]
      }
    },
    include: { tasks: true }
  })

  console.log("✅ User created:", user)
  console.log("✅ Quest created:", quest)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
