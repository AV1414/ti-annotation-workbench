import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { TaskForm } from '../_components/task-form';
import { PageContainer } from '@/components/layout/PageContainer';

export default function NewTaskPage() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  return (
    <PageContainer className="max-w-3xl">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="size-4" /> Back to tasks
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Create New Task</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure a new annotation task for data collection.
        </p>
      </div>
      <TaskForm hasApiKey={hasApiKey} />
    </PageContainer>
  );
}
