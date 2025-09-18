import { Worker } from 'bullmq'
import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'
import { config } from './config'

const prisma = new PrismaClient()
const openai = new OpenAI({ apiKey: config.openaiApiKey })

const questWorker = new Worker('quests', async job => {
  if (job.name === 'decompose') {
    const { questId, title, description } = job.data

    const prompt = `Decompose the quest "${title}" into ordered sub-tasks. 
    Return as JSON array of {title, details}.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    })

    const tasks = JSON.parse(response.choices[0].message?.content || '[]')

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
  }
}, { connection: { host: config.redisHost, port: config.redisPort } })

console.log("Questify worker is running...")
