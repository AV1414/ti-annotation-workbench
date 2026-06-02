'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

const TASK_TYPE_LABELS: Record<Task['taskType'], string> = {
  preference: 'Preference',
  red_teaming: 'Red Teaming',
  rating: 'Rating',
};

const SCALE_LABELS: Record<Task['ratingScale'], string> = {
  binary: 'Binary',
  four_point: '4-point',
  likert_7: 'Likert 7',
  custom: 'Custom',
};

const STATUS_VARIANT: Record<Task['status'], 'outline' | 'secondary' | 'default'> = {
  draft: 'outline',
  active: 'default',
  completed: 'secondary',
};

interface TaskTableProps {
  tasks: Task[];
}

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
      <div className="rounded-lg border overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Scale</TableHead>
              <TableHead>Dimensions</TableHead>
              <TableHead className="text-center">Prompts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{task.name}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-[220px] truncate">
                        {task.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{TASK_TYPE_LABELS[task.taskType]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{SCALE_LABELS[task.ratingScale]}</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {task.dimensions.map((d) => d.label).join(', ')}
                  </span>
                </TableCell>
                <TableCell className="text-center text-sm tabular-nums">
                  {task.prompts.length}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[task.status]} className="capitalize">
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {relativeTime(task.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/${task.id}`} aria-label="Edit task">
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete task"
                      onClick={() => setDeleteTarget(task)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
