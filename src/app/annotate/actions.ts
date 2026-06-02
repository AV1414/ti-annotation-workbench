'use server';

import { revalidatePath } from 'next/cache';
import { createAnnotation, deleteAnnotationsByAnnotatorAndTask } from '@/lib/repository';
import type { Annotation } from '@/lib/types';

export async function submitAnnotationAction(
  annotation: Omit<Annotation, 'id' | 'createdAt'>,
): Promise<{ ok: boolean; annotation?: Annotation; error?: string }> {
  try {
    const created = await createAnnotation(annotation);
    revalidatePath('/annotate');
    return { ok: true, annotation: created };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function resetAnnotationsAction(
  taskId: string,
  annotatorId: string,
): Promise<{ ok: boolean; deleted?: number; error?: string }> {
  try {
    const deleted = await deleteAnnotationsByAnnotatorAndTask(taskId, annotatorId);
    revalidatePath(`/annotate/${taskId}`);
    revalidatePath('/annotate');
    return { ok: true, deleted };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
