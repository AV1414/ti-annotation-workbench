import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getTask } from '@/lib/repository';
import { TaskForm } from '../_components/task-form';

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params;
  const task = await getTask(id);

  if (!task) notFound();

  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="size-4" /> Back to tasks
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{task.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Edit task configuration.</p>
      </div>
      <TaskForm task={task} hasApiKey={hasApiKey} />
    </div>
  );
}
