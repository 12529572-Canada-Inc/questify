import fs from "fs";

// Load your raw dumps
const quests = JSON.parse(fs.readFileSync("quests.json", "utf8"));
const tasks = JSON.parse(fs.readFileSync("tasks.json", "utf8"));

// Map quests by id
const questMap: { [key: string]: { title: string; goal?: string; context?: string; constraints?: string; tasks: any[] } } = {};
for (const q of quests) {
  questMap[q.id] = {
    title: q.title,
    goal: q.goal ?? q.description ?? null,
    context: q.context ?? null,
    constraints: q.constraints ?? null,
    tasks: []
  };
}

// Attach tasks to the right quest
for (const t of tasks) {
  if (questMap[t.questId]) {
    questMap[t.questId].tasks.push({
      title: t.title,
      details: t.details,
      order: t.order
    });
  }
}

// Final array
const finalData = Object.values(questMap).map((quest) => {
  const { title, tasks } = quest;
  const payload: Record<string, unknown> = { title, tasks };

  if (quest.goal) payload.goal = quest.goal;
  if (quest.context) payload.context = quest.context;
  if (quest.constraints) payload.constraints = quest.constraints;

  return payload;
});

// Write to seed-data.json
fs.writeFileSync("seed-data.json", JSON.stringify(finalData, null, 2));

console.log("✅ seed-data.json created!");
