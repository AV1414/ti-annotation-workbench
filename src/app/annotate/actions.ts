'use server';

import { revalidatePath } from 'next/cache';
import { createAnnotation } from '@/lib/repository';
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
