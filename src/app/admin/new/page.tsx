import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { TaskForm } from '../_components/task-form';

export default function NewTaskPage() {
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
        <h1 className="text-2xl font-bold tracking-tight">Create New Task</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure a new annotation task for data collection.
        </p>
      </div>
      <TaskForm hasApiKey={hasApiKey} />
    </div>
  );
}
