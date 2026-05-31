import { type NextRequest } from 'next/server';
import { generateResponsePair } from '@/lib/anthropic';
import { kv } from '@/lib/kv';

export async function POST(req: NextRequest): Promise<Response> {
  // Rate limiting: max 30 requests per IP per minute via KV
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';
  const bucket = Math.floor(Date.now() / 60_000);
  const rlKey = `ratelimit:generate:${ip}:${bucket}`;

  try {
    const count = await kv.incr(rlKey);
    if (count === 1) await kv.expire(rlKey, 60);
    if (count > 30) {
      return Response.json(
        { error: 'Rate limit reached. Wait a minute and try again.' },
        { status: 429 },
      );
    }
  } catch {
    // KV unavailable — fail open and allow the request
  }

  let body: { prompt?: unknown; configA?: Record<string, unknown>; configB?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.prompt || typeof body.prompt !== 'string' || !body.prompt.trim()) {
    return Response.json({ error: 'prompt is required' }, { status: 400 });
  }

  const configA = body.configA ?? {};
  const configB = body.configB ?? {};

  try {
    const result = await generateResponsePair(body.prompt, {
      modelA: typeof configA.model === 'string' ? configA.model : undefined,
      modelB: typeof configB.model === 'string' ? configB.model : undefined,
      temperatureA: typeof configA.temperature === 'number' ? configA.temperature : undefined,
      temperatureB: typeof configB.temperature === 'number' ? configB.temperature : undefined,
      systemPromptA: typeof configA.systemPrompt === 'string' ? configA.systemPrompt : undefined,
      systemPromptB: typeof configB.systemPrompt === 'string' ? configB.systemPrompt : undefined,
    });

    return Response.json({
      responseA: result.responseA,
      responseB: result.responseB,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('Rate limit')) return Response.json({ error: message }, { status: 429 });
    if (message.includes('ANTHROPIC_API_KEY') || message.includes('not configured')) {
      return Response.json(
        { error: 'Live generation disabled (no API key configured)' },
        { status: 503 },
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
