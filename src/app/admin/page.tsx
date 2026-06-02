import Link from 'next/link';
import { Plus, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listTasks } from '@/lib/repository';
import { TaskTable } from './_components/task-table';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';

export default async function AdminPage() {
  const tasks = await listTasks();

  return (
    <PageContainer>
      <PageHeader
        title="Annotation Tasks"
        description="Configure preference data collection tasks for RLHF fine-tuning."
        action={
          <Button asChild size="default">
            <Link href="/admin/new">
              <Plus className="size-4" /> Create New Task
            </Link>
          </Button>
        }
      />

      {tasks.length > 0 ? (
        <TaskTable tasks={tasks} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-24 text-center bg-card">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ClipboardList className="size-6 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">No tasks yet</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Create your first annotation task to start collecting preference data.
          </p>
          <Button className="mt-6" size="sm" asChild>
            <Link href="/admin/new">
              <Plus className="size-4" /> Create your first task
            </Link>
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
