'use server';

import { revalidatePath } from 'next/cache';
import { createTask, updateTask, deleteTask } from '@/lib/repository';
import type { Task } from '@/lib/types';

type ActionResult = { error?: string };

export async function createTaskAction(
  data: Omit<Task, 'id' | 'createdAt'>,
): Promise<ActionResult> {
  try {
    await createTask(data);
    revalidatePath('/admin');
    return {};
  } catch (err) {
    return { error: String(err) };
  }
}

export async function updateTaskAction(
  id: string,
  data: Partial<Task>,
): Promise<ActionResult> {
  try {
    await updateTask(id, data);
    revalidatePath('/admin');
    revalidatePath(`/admin/${id}`);
    return {};
  } catch (err) {
    return { error: String(err) };
  }
}

export async function deleteTaskAction(id: string): Promise<ActionResult> {
  try {
    await deleteTask(id);
    revalidatePath('/admin');
    return {};
  } catch (err) {
    return { error: String(err) };
  }
}
