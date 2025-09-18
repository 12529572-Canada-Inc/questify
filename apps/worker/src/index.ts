import { Worker } from 'bullmq'
import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'
import { config } from './config'
import { parseJsonFromModel } from './helpers'

const prisma = new PrismaClient()
const openai = new OpenAI({ apiKey: config.openaiApiKey })

const questWorker = new Worker('quests', async job => {
  if (job.name === 'decompose') {
    console.log("Decomposing quest:", job.data)
    const { questId, title, description } = job.data

    const prompt = `Decompose the quest "${title}: ${description}" into ordered sub-tasks. 
    Return as JSON array of {title, details}.`
    console.log("Prompt:", prompt)
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })

      console.log("OpenAI response:", response);

      const content = response.choices[0].message?.content || '';
      console.log("OpenAI content:", content);

      // Use the helper function to parse JSON
      const tasks = parseJsonFromModel(content)

      console.log("Parsed tasks:", tasks);

      for (let i = 0; i < tasks.length; i++) {
        await prisma.task.create({
          data: {
            questId,
            title: tasks[i].title,
            details: tasks[i].details,
            order: i
          }
        })
      }

      await prisma.quest.update({ where: { id: questId }, data: { status: 'active' } })
    } catch (error) {
      console.error("Error during quest decomposition:", error)
      await prisma.quest.update({ where: { id: questId }, data: { status: 'failed' } })
    }
  }
}, { connection: { host: config.redisHost, port: config.redisPort } })

console.log("Questify worker is running...")
