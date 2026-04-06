import Anthropic from '@anthropic-ai/sdk'
import env from '#start/env'
import AiPrompt from '#models/ai_prompt'

interface GenerateTipsOptions {
  userId: string
  sourceType: 'feedback' | 'martial_art' | 'class'
  sourceId?: string
  focusArea?: string
  martialArt?: string
}

export class AiService {
  static async generateTips(
    systemPrompt: string,
    userPrompt: string,
    options: GenerateTipsOptions
  ): Promise<string | null> {
    const apiKey = env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return null
    }

    const client = new Anthropic({ apiKey })

    const aiResponse = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
    const responseText = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : ''
    await AiPrompt.create({
      userId: options.userId,
      promptText: userPrompt,
      responseText,
      sourceType: options.sourceType,
      sourceId: options.sourceId ?? null,
      focusArea: options.focusArea ?? null,
      martialArt: options.martialArt ?? null,
    })

    return responseText
  }
}
