import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { listTasks, listAnnotationsByTask, getProgress } from '@/lib/repository';
import { KpiCard } from './_components/KpiCard';
import { ActivityChart } from './_components/ActivityChart';
import { DashboardTaskTable } from './_components/DashboardTaskTable';
import type { Annotation, TaskProgress } from '@/lib/types';

function fmt(n: number): string {
  return n.toLocaleString();
}

// Build a 14-day daily annotation count from all annotations
function buildActivityData(annotations: Annotation[]): { date: string; count: number }[] {
  const days: { date: string; count: number }[] = [];
  const now = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dateStr = d.toISOString().slice(0, 10);
    const count = annotations.filter((a) => a.createdAt.startsWith(dateStr)).length;
    days.push({ date: label, count });
  }
  return days;
}

export default async function DashboardPage() {
  const tasks = await listTasks();

  const [allAnnotationsByTask, allProgress] = await Promise.all([
    Promise.all(tasks.map((t) => listAnnotationsByTask(t.id))),
    Promise.all(tasks.map((t) => getProgress(t.id))),
  ]);

  const allAnnotations = allAnnotationsByTask.flat();
  const progressMap: Record<string, TaskProgress> = {};
  tasks.forEach((t, i) => { progressMap[t.id] = allProgress[i]; });

  // KPI derivations
  const activeTasks = tasks.filter((t) => t.status === 'active');
  const draftTasks = tasks.filter((t) => t.status === 'draft');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const uniqueAnnotators = new Set(allAnnotations.map((a) => a.annotatorId)).size;

  const avgCompletionPct = activeTasks.length > 0
    ? Math.round(activeTasks.reduce((sum, t) => sum + (progressMap[t.id]?.completionPct ?? 0), 0) / activeTasks.length)
    : 0;

  const totalPromptsActive = activeTasks.reduce((sum, t) => sum + t.prompts.length, 0);
  const totalAnnotationsActive = activeTasks.reduce(
    (sum, t) => sum + (progressMap[t.id]?.annotationsCount ?? 0), 0
  );
  const avgAnnotationsPerPrompt = totalPromptsActive > 0
    ? (totalAnnotationsActive / totalPromptsActive).toFixed(1)
    : '—';

  const activityData = buildActivityData(allAnnotations);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational health for your RLHF annotation pipeline
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Tasks"
          value={fmt(tasks.length)}
          sub={`${activeTasks.length} active · ${draftTasks.length} draft · ${completedTasks.length} completed`}
        />
        <KpiCard
          title="Total Annotations"
          value={fmt(allAnnotations.length)}
          sub={`across ${uniqueAnnotators} annotator${uniqueAnnotators !== 1 ? 's' : ''}`}
        />
        <KpiCard
          title="Completion Rate"
          value={`${avgCompletionPct}%`}
          sub="average across active tasks"
          progress={avgCompletionPct}
        />
        <KpiCard
          title="Avg Annotations / Prompt"
          value={avgAnnotationsPerPrompt}
          sub="Higher = stronger inter-annotator signal"
          tooltip="Multiple annotations per prompt reduce noise in reward model training. Anthropic averaged ~3 labels per comparison in their HH dataset (Bai et al. 2022 §2)."
        />
      </div>

      {/* Activity chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Annotations — last 14 days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityChart data={activityData} />
        </CardContent>
      </Card>

      {/* Task table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">All Tasks</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/new"><Plus className="size-3.5" /> New Task</Link>
          </Button>
        </div>

        {tasks.length > 0 ? (
          <DashboardTaskTable tasks={tasks} progressMap={progressMap} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
            <p className="text-lg font-medium">No tasks yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Create your first annotation task to see data here.</p>
            <Button className="mt-6" asChild>
              <Link href="/admin/new"><Plus className="size-4" /> Create your first task</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
