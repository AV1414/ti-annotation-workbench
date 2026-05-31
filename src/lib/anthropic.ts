import Anthropic from '@anthropic-ai/sdk';

export interface GenerationResult {
  text: string;
  model: string;
  temperature: number;
  usage: { input_tokens: number; output_tokens: number };
}

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not configured');
  return new Anthropic({ apiKey: key });
}

export async function generateResponse(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    systemPrompt?: string;
    maxTokens?: number;
  } = {},
): Promise<GenerationResult> {
  const {
    model = 'claude-haiku-4-5',
    temperature = 1.0,
    systemPrompt,
    maxTokens = 512,
  } = options;

  const client = getClient();

  try {
    const message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    return { text, model, temperature, usage: message.usage };
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      if (err.status === 429) throw new Error('Rate limit reached. Wait a minute and try again.');
      if (err.status === 401) throw new Error('Invalid API key. Check ANTHROPIC_API_KEY.');
      throw new Error(`API error (${err.status}): ${err.message}`);
    }
    throw new Error('Unexpected error during generation');
  }
}

export async function generateResponsePair(
  prompt: string,
  options: {
    systemPromptA?: string;
    systemPromptB?: string;
    modelA?: string;
    modelB?: string;
    temperatureA?: number;
    temperatureB?: number;
  } = {},
): Promise<{ responseA: GenerationResult; responseB: GenerationResult }> {
  const {
    modelA = 'claude-haiku-4-5',
    modelB = 'claude-haiku-4-5',
    temperatureA = 0.3,
    temperatureB = 1.0,
    systemPromptA,
    systemPromptB = 'Be concise. Respond in fewer than 100 words.',
  } = options;

  const [responseA, responseB] = await Promise.all([
    generateResponse(prompt, { model: modelA, temperature: temperatureA, systemPrompt: systemPromptA }),
    generateResponse(prompt, { model: modelB, temperature: temperatureB, systemPrompt: systemPromptB }),
  ]);

  return { responseA, responseB };
}
