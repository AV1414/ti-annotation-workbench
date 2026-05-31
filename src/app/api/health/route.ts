import { kv } from '@/lib/kv';

export async function GET(): Promise<Response> {
  try {
    const probe = `health:probe:${Date.now()}`;
    const start = performance.now();
    await kv.set(probe, '1', { ex: 10 });
    const val = await kv.get(probe);
    const kvLatencyMs = Math.round(performance.now() - start);

    if (val === null) {
      return Response.json({ status: 'error', detail: 'KV round-trip value mismatch' }, { status: 500 });
    }

    return Response.json({ status: 'ok', kvLatencyMs });
  } catch (err) {
    console.error('Health check failed:', err);
    return Response.json({ status: 'error', detail: String(err) }, { status: 500 });
  }
}
