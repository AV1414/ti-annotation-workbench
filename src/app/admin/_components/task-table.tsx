'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteTaskAction } from '../actions';
import type { Task } from '@/lib/types';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

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

const STATUS_VARIANT: Record<Task['status'], 'success' | 'warning' | 'secondary'> = {
  active: 'success',
  draft: 'warning',
  completed: 'secondary',
};

interface TaskTableProps {
  tasks: Task[];
}

const COL = 'grid grid-cols-[2fr_1fr_1fr_1.5fr_auto_1fr_1fr_auto] items-center gap-4 px-4';

export function TaskTable({ tasks }: TaskTableProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteTaskAction(deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);
    if (result.error) {
      toast.error(`Delete failed: ${result.error}`);
    } else {
      toast.success(`"${deleteTarget.name}" deleted`);
      router.refresh();
    }
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <div className="min-w-[780px]">
          {/* Header */}
          <div className={`${COL} h-10 bg-muted/50 border-b border-border`}>
            {['Task', 'Type', 'Scale', 'Dimensions', 'Prompts', 'Status', 'Created', ''].map((h) => (
              <span key={h} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`${COL} h-16 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors`}
            >
              {/* Task name + description */}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{task.name}</p>
                {task.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>
                )}
              </div>

              {/* Type */}
              <Badge variant={TYPE_VARIANT[task.taskType]}>{TYPE_LABEL[task.taskType]}</Badge>

              {/* Scale */}
              <span className="font-mono text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground w-fit">
                {SCALE_LABEL[task.ratingScale]}
              </span>

              {/* Dimensions */}
              <span className="text-xs text-muted-foreground truncate">
                {task.dimensions.map((d) => d.label).join(' · ')}
              </span>

              {/* Prompts */}
              <span className="text-sm font-semibold tabular-nums text-center">
                {task.prompts.length}
              </span>

              {/* Status */}
              <Badge variant={STATUS_VARIANT[task.status]} className="capitalize">
                {task.status}
              </Badge>

              {/* Created */}
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {relativeTime(task.createdAt)}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon-xs" asChild>
                  <Link href={`/admin/${task.id}`} aria-label="Edit task">
                    <Pencil className="size-3.5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Delete task"
                  onClick={() => setDeleteTarget(task)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also delete all associated annotations. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
