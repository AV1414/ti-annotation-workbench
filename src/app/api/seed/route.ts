import { seedDatabase, seedSampleAnnotations } from '@/lib/seed';

export async function POST(): Promise<Response> {
  try {
    const taskResult = await seedDatabase();
    const annotationResult = await seedSampleAnnotations();
    return Response.json({
      ok: true,
      tasks: taskResult,
      annotations: annotationResult,
    });
  } catch (err) {
    console.error('Seed failed:', err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
