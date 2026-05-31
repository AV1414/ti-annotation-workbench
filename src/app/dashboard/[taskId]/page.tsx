import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Pencil, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getTask, listAnnotationsByTask } from '@/lib/repository';
import { computeExportStats } from '@/lib/export';
import { KpiCard } from '../_components/KpiCard';
import { ExportDialog } from './_components/ExportDialog';
import { TaskDetailTabs } from './_components/TaskDetailTabs';

const TYPE_LABELS: Record<string, string> = {
  preference: 'Preference',
  red_teaming: 'Red Teaming',
  rating: 'Rating',
};

const SCALE_LABELS: Record<string, string> = {
  binary: 'Binary',
  four_point: '4-point margin',
  likert_7: 'Likert 7',
  custom: 'Custom',
};

interface TaskDetailPageProps {
  params: Promise<{ taskId: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { taskId } = await params;

  const [task, annotations] = await Promise.all([
    getTask(taskId),
    listAnnotationsByTask(taskId),
  ]);

  if (!task) notFound();

  const uniqueAnnotators = new Set(annotations.map((a) => a.annotatorId)).size;
  const totalPrompts = task.prompts.length;
  const completionPct = totalPrompts > 0
    ? Math.round((annotations.length / totalPrompts) * 100)
    : 0;

  const exportStats = computeExportStats(task, annotations);

  const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'default'> = {
    draft: 'outline',
    active: 'default',
    completed: 'secondary',
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">{task.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{task.name}</h1>
          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{TYPE_LABELS[task.taskType]}</Badge>
            <Badge variant="secondary">{SCALE_LABELS[task.ratingScale]}</Badge>
            <Badge variant={STATUS_VARIANT[task.status]} className="capitalize">{task.status}</Badge>
            {task.dimensions.map((d) => (
              <Badge key={d.id} variant="outline" className="text-xs">{d.label}</Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <ExportDialog taskId={taskId} stats={exportStats} />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/annotate/${taskId}`}>
              View as Annotator <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/${taskId}`}>
              <Pencil className="size-3.5" /> Edit Task
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Prompts"
          value={totalPrompts.toLocaleString()}
        />
        <KpiCard
          title="Total Annotations"
          value={annotations.length.toLocaleString()}
          sub={`${exportStats.trlLines} exportable lines`}
        />
        <KpiCard
          title="Unique Annotators"
          value={uniqueAnnotators.toLocaleString()}
        />
        <KpiCard
          title="Completion"
          value={`${completionPct}%`}
          sub={`${annotations.length} / ${totalPrompts} prompts annotated`}
          progress={completionPct}
        />
      </div>

      {/* Tabs */}
      <TaskDetailTabs task={task} annotations={annotations} />
    </div>
  );
}
