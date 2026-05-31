import { listTasks } from '@/lib/repository';
import { seedDatabase } from '@/lib/seed';

export async function POST(): Promise<Response> {
  try {
    const existing = await listTasks();
    if (existing.length > 0) {
      return Response.json({ ok: true, created: 0, skipped: true, reason: 'Tasks already exist' });
    }
    const result = await seedDatabase();
    return Response.json({ ok: true, created: result.created, skipped: false });
  } catch (err) {
    console.error('Seed failed:', err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
