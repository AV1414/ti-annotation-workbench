import { kv } from './kv';
import type { Task, Annotation, Annotator, TaskProgress } from './types';

// ── Tasks ──────────────────────────────────────────────────────────────────

export async function createTask(task: Omit<Task, 'id' | 'createdAt'> & Partial<Pick<Task, 'id' | 'createdAt'>>): Promise<Task> {
  const id = task.id ?? crypto.randomUUID();
  const full: Task = { ...task, id, createdAt: task.createdAt ?? new Date().toISOString() } as Task;
  await Promise.all([
    kv.set(`task:${id}`, full),
    kv.sadd('tasks:index', id),
  ]);
  return full;
}

export async function getTask(id: string): Promise<Task | null> {
  return kv.get<Task>(`task:${id}`);
}

export async function listTasks(): Promise<Task[]> {
  const ids = await kv.smembers<string[]>('tasks:index');
  if (!ids.length) return [];
  const tasks = await Promise.all(ids.map((id) => kv.get<Task>(`task:${id}`)));
  return tasks.filter((t): t is Task => t !== null);
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task | null> {
  const existing = await getTask(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch, id };
  await kv.set(`task:${id}`, updated);
  return updated;
}

export async function deleteTask(id: string): Promise<void> {
  await Promise.all([
    kv.del(`task:${id}`),
    kv.srem('tasks:index', id),
  ]);
}

// ── Annotations ────────────────────────────────────────────────────────────

export async function createAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt'> & Partial<Pick<Annotation, 'id' | 'createdAt'>>): Promise<Annotation> {
  const id = annotation.id ?? crypto.randomUUID();
  const full: Annotation = { ...annotation, id, createdAt: annotation.createdAt ?? new Date().toISOString() } as Annotation;
  await Promise.all([
    kv.set(`annotation:${id}`, full),
    kv.sadd(`task:${full.taskId}:annotations`, id),
    kv.set(`annotator:${full.annotatorId}`, { id: full.annotatorId } satisfies Partial<import('./types').Annotator>),
  ]);
  return full;
}

export async function getAnnotation(id: string): Promise<Annotation | null> {
  return kv.get<Annotation>(`annotation:${id}`);
}

export async function listAnnotationsByTask(taskId: string): Promise<Annotation[]> {
  const ids = await kv.smembers<string[]>(`task:${taskId}:annotations`);
  if (!ids.length) return [];
  const annotations = await Promise.all(ids.map((id) => kv.get<Annotation>(`annotation:${id}`)));
  return annotations.filter((a): a is Annotation => a !== null);
}

export async function deleteAnnotationsByAnnotatorAndTask(
  taskId: string,
  annotatorId: string,
): Promise<number> {
  const all = await listAnnotationsByTask(taskId);
  const mine = all.filter((a) => a.annotatorId === annotatorId);
  await Promise.all(
    mine.map((a) =>
      Promise.all([
        kv.del(`annotation:${a.id}`),
        kv.srem(`task:${taskId}:annotations`, a.id),
      ]),
    ),
  );
  return mine.length;
}

// ── Progress ───────────────────────────────────────────────────────────────

export async function getProgress(taskId: string): Promise<TaskProgress> {
  const [task, annotations] = await Promise.all([
    getTask(taskId),
    listAnnotationsByTask(taskId),
  ]);
  const totalPrompts = task?.prompts.length ?? 0;
  const uniquePromptsAnnotated = new Set(annotations.map((a) => a.promptId)).size;
  const totalAnnotations = annotations.length;
  const uniqueAnnotators = new Set(annotations.map((a) => a.annotatorId)).size;
  const completionPct = totalPrompts > 0
    ? Math.min(100, Math.round((uniquePromptsAnnotated / totalPrompts) * 100))
    : 0;
  return { totalPrompts, uniquePromptsAnnotated, completionPct, totalAnnotations, uniqueAnnotators };
}
