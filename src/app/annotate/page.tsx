import Link from 'next/link';
import { Plus, ClipboardList } from 'lucide-react';
import { listTasks, getProgress } from '@/lib/repository';
import { AnnotatorIdentity } from '@/components/annotate/AnnotatorIdentity';
import { TaskCard } from '@/components/annotate/TaskCard';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';

export default async function AnnotatePage() {
  const allTasks = await listTasks();
  const activeTasks = allTasks.filter((t) => t.status === 'active');

  const progressList = await Promise.all(
    activeTasks.map((t) => getProgress(t.id)),
  );

  return (
    <PageContainer>
      <PageHeader
        title="Annotation Tasks"
        description="Pick a task to start labeling. Each task uses a different RLHF methodology — try both to see how the rating interface adapts."
      />

      {/* Annotator identity */}
      <div className="mb-6">
        <AnnotatorIdentity />
      </div>

      {activeTasks.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {activeTasks.map((task, i) => (
            <TaskCard key={task.id} task={task} progress={progressList[i]} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-24 text-center bg-card">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ClipboardList className="size-6 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">No active tasks</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            An admin needs to create and activate a task before you can annotate.
          </p>
          <Button className="mt-6" size="sm" asChild>
            <Link href="/admin/new">
              <Plus className="size-4" /> Create a task
            </Link>
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
