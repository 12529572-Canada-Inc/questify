import { hashPassword, prisma } from 'shared/server'
import { defaultModelPersonas } from 'shared'
import fs from 'fs';
import { ensureSuperAdmin, syncPrivilegesAndRoles } from './utils/accessControl'

async function seedModelPersonas() {
  console.log('🎭 Seeding model personas...')
  for (const persona of defaultModelPersonas) {
    await prisma.modelPersona.upsert({
      where: { key: persona.key },
      update: {
        name: persona.name,
        tagline: persona.tagline,
        avatarUrl: persona.avatarUrl ?? null,
        bestFor: persona.bestFor,
        speed: persona.speed,
        cost: persona.cost,
        contextLength: persona.contextLength,
        provider: persona.provider,
        modelId: persona.modelId,
        notes: persona.notes ?? null,
        infoUrl: persona.infoUrl ?? null,
        recommended: Boolean(persona.recommended),
        recommendedReason: persona.recommendedReason ?? null,
        active: persona.active !== false,
      },
      create: {
        key: persona.key,
        name: persona.name,
        tagline: persona.tagline,
        avatarUrl: persona.avatarUrl ?? null,
        bestFor: persona.bestFor,
        speed: persona.speed,
        cost: persona.cost,
        contextLength: persona.contextLength,
        provider: persona.provider,
        modelId: persona.modelId,
        notes: persona.notes ?? null,
        infoUrl: persona.infoUrl ?? null,
        recommended: Boolean(persona.recommended),
        recommendedReason: persona.recommendedReason ?? null,
        active: persona.active !== false,
      },
    })
  }
}

async function main() {
  console.log("🌱 Seeding database...")

  console.log("🔐 Syncing roles & privileges...")
  await syncPrivilegesAndRoles(prisma)

  // Create an initial Super Admin user (only if no users exist)
  const userCount = await prisma.user.count()
  let user = null
  if (userCount === 0) {
    user = await prisma.user.create({
      data: {
          name: 'Super Admin',
          email: 'superadmin@example.com',
          password: hashPassword('supersecurepassword'),
        },
    })
    console.log("✅ Created Super Admin user:", user)
  }

  console.log("🔐 Ensuring Super Admin exists...")
  await ensureSuperAdmin(prisma)

  await seedModelPersonas()

  // Check if there are existing quests
  const existingQuests = await prisma.quest.count()
  if (existingQuests > 0) {
    console.log("⚠️ Quests already exist in the database. Skipping quest seeding.")
    return
  }
  // Load the merged seed data
  const data = JSON.parse(fs.readFileSync("./seed-data.json", "utf8"));

  // Create a user to own the quests
  user = await prisma.user.create({
    data: {
      name: 'Sample Quest Owner',
      email: 'questowner@example.com',
      password: hashPassword('questownerpassword'),
    },
  });

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
