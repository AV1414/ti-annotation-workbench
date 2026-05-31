import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listTasks, getProgress } from '@/lib/repository';
import { AnnotatorIdentity } from '@/components/annotate/AnnotatorIdentity';
import { TaskCard } from '@/components/annotate/TaskCard';
import { Button } from '@/components/ui/button';

export default async function AnnotatePage() {
  const allTasks = await listTasks();
  const activeTasks = allTasks.filter((t) => t.status === 'active');

  const progressList = await Promise.all(
    activeTasks.map((t) => getProgress(t.id)),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Available Annotation Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick a task to start labeling</p>
      </div>

      <AnnotatorIdentity />

      {activeTasks.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activeTasks.map((task, i) => (
            <TaskCard key={task.id} task={task} progress={progressList[i]} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
          <p className="text-lg font-medium">No active tasks</p>
          <p className="mt-1 text-sm text-muted-foreground">
            An admin needs to create and activate a task before you can annotate.
          </p>
          <Button className="mt-6" variant="outline" asChild>
            <Link href="/admin/new">
              <Plus className="size-4" /> Create a task
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
