import { type NextRequest } from 'next/server';
import { getTask, listAnnotationsByTask } from '@/lib/repository';
import { generateExportLines } from '@/lib/export';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
): Promise<Response> {
  const { taskId } = await params;
  const { searchParams } = request.nextUrl;

  const format = searchParams.get('format') ?? 'jsonl';
  const style = (searchParams.get('style') ?? 'trl') as 'trl' | 'raw';
  const preview = searchParams.get('preview');
  const limit = preview ? parseInt(preview, 10) : undefined;

  if (format !== 'jsonl') {
    return Response.json({ error: 'Only format=jsonl is supported. csv and parquet: 501 Not Implemented.' }, { status: 501 });
  }

  const [task, annotations] = await Promise.all([
    getTask(taskId),
    listAnnotationsByTask(taskId),
  ]);

  if (!task) {
    return Response.json({ error: 'Task not found' }, { status: 404 });
  }

  const lines = generateExportLines(task, annotations, { style, limit });
  const body = lines.join('\n') + (lines.length > 0 ? '\n' : '');

  if (preview) {
    return Response.json({ lines, total: lines.length });
  }

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return new Response(body, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Content-Disposition': `attachment; filename="task-${taskId}-${timestamp}.jsonl"`,
    },
  });
}
