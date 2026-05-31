import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listTasks } from '@/lib/repository';
import { TaskTable } from './_components/task-table';

export default async function AdminPage() {
  const tasks = await listTasks();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Annotation Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure preference data collection for RLHF fine-tuning
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/new">
            <Plus className="size-4" />
            Create New Task
          </Link>
        </Button>
      </div>

      {tasks.length > 0 ? (
        <TaskTable tasks={tasks} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
          <p className="text-lg font-medium">No tasks yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first annotation task to start collecting preference data.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/admin/new">
              <Plus className="size-4" />
              Create your first task
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
