import Anthropic from '@anthropic-ai/sdk'
import env from '#start/env'

export class AiService {
  static async generateTips(systemPrompt: string, userPrompt: string): Promise<string | null> {
    const apiKey = env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return null
    }

    const client = new Anthropic({ apiKey })

    const aiResponse = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    return aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : ''
  }
}
