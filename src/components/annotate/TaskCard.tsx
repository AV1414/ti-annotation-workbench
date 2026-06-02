import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBar } from './ProgressBar';
import type { Task, TaskProgress } from '@/lib/types';

const TYPE_LABEL: Record<Task['taskType'], string> = {
  preference: 'Preference',
  red_teaming: 'Red Teaming',
  rating: 'Rating',
};

const TYPE_VARIANT: Record<Task['taskType'], 'info' | 'danger' | 'secondary'> = {
  preference: 'info',
  red_teaming: 'danger',
  rating: 'secondary',
};

const SCALE_LABEL: Record<Task['ratingScale'], string> = {
  binary: 'Binary',
  four_point: '4-point',
  likert_7: 'Likert-7',
  custom: 'Custom',
};

const METHODOLOGY_LABEL: Partial<Record<Task['ratingScale'], string>> = {
  binary: 'Anthropic-style',
  four_point: 'Meta-style',
};

const METHODOLOGY_VARIANT: Partial<Record<Task['ratingScale'], 'info' | 'purple'>> = {
  binary: 'info',
  four_point: 'purple',
};

interface TaskCardProps {
  task: Task;
  progress: TaskProgress;
}

export function TaskCard({ task, progress }: TaskCardProps) {
  const methodologyVariant = METHODOLOGY_VARIANT[task.ratingScale];
  const sub = progress.totalAnnotations > 0
    ? `${progress.totalAnnotations} annotation${progress.totalAnnotations !== 1 ? 's' : ''} · ${progress.uniqueAnnotators} reviewer${progress.uniqueAnnotators !== 1 ? 's' : ''}`
    : undefined;

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card shadow-sm transition-all duration-150 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {methodologyVariant && METHODOLOGY_LABEL[task.ratingScale] && (
            <Badge variant={methodologyVariant}>{METHODOLOGY_LABEL[task.ratingScale]}</Badge>
          )}
          <Badge variant={TYPE_VARIANT[task.taskType]}>{TYPE_LABEL[task.taskType]}</Badge>
          <Badge variant="secondary" className="font-mono">{SCALE_LABEL[task.ratingScale]}</Badge>
        </div>
        <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground">
          {task.name}
        </h3>
        {task.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border/60 mx-5" />

      {/* Stats */}
      <div className="px-5 py-4 space-y-2.5">
        {task.dimensions.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {task.dimensions.map((d) => d.label).join(' · ')}
          </p>
        )}
        <ProgressBar
          current={progress.uniquePromptsAnnotated}
          total={progress.totalPrompts}
          pct={progress.completionPct}
          showLabel
          sub={sub}
        />
      </div>

      {/* Footer */}
      <div className="px-5 py-4 pt-3 border-t border-border/60 bg-muted/30 mt-auto rounded-b-lg">
        <Button asChild size="sm" className="w-full">
          <Link href={`/annotate/${task.id}`}>
            Start annotating <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
