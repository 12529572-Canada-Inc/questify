declare module 'openai' {
  export interface ChatCompletionMessage {
    content?: string
  }

  export interface ChatCompletionChoice {
    message?: ChatCompletionMessage
  }

  export interface ChatCompletionsClient {
    create(input: {
      model: string
      messages: Array<{ role: string, content: unknown }>
    }): Promise<{ choices: ChatCompletionChoice[] }>
  }

  export interface ChatClient {
    completions: ChatCompletionsClient
  }

  export default class OpenAI {
    constructor(options: { apiKey: string, baseURL?: string })
    chat: ChatClient
  }
}
