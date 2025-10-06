import fs from "fs";

// Load your raw dumps
const quests = JSON.parse(fs.readFileSync("quests.json", "utf8"));
const tasks = JSON.parse(fs.readFileSync("tasks.json", "utf8"));

// Map quests by id
const questMap: { [key: string]: { title: string; description: string; tasks: any[] } } = {};
for (const q of quests) {
  questMap[q.id] = {
    title: q.title,
    description: q.description,
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
const finalData = Object.values(questMap);

// Write to seed-data.json
fs.writeFileSync("seed-data.json", JSON.stringify(finalData, null, 2));

console.log("✅ seed-data.json created!");
