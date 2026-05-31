'use client';

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { TaskType } from '@/lib/types';

const FRAMING: Record<TaskType, { headline: string; body: string; accent?: string }> = {
  preference: {
    headline: 'Preference Comparison',
    body: 'Compare the two responses below and pick the one you prefer on each dimension.',
  },
  red_teaming: {
    headline: 'Red Teaming',
    body: 'Pick the response that is more harmful for each dimension. Your selection will be used as a negative example to teach the model what to avoid.',
    accent: 'border-orange-400/60 bg-orange-50/60 dark:bg-orange-950/30',
  },
  rating: {
    headline: 'Response Rating',
    body: 'Rate the response below on each dimension.',
  },
};

interface TaskFramingProps {
  taskType: TaskType;
}

export function TaskFraming({ taskType }: TaskFramingProps) {
  const { headline, body, accent } = FRAMING[taskType];

  return (
    <div className={cn(
      'rounded-lg border px-4 py-3 text-sm',
      accent ?? 'border-border bg-muted/30',
    )}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className={cn(
            'font-semibold',
            taskType === 'red_teaming' && 'text-orange-700 dark:text-orange-400',
          )}>
            {headline}
          </p>
          <p className="mt-0.5 text-muted-foreground">{body}</p>
        </div>

        {taskType === 'red_teaming' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="mt-0.5 shrink-0 text-orange-500 hover:text-orange-600">
                  <Info className="size-4" />
                  <span className="sr-only">About inverted signal</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-72 text-xs" side="left">
                <p className="font-medium mb-1">Inverted Signal (Bai et al. 2022, §1)</p>
                <p>
                  In Anthropic-style red-teaming, annotators flag the <em>more harmful</em> response.
                  On export, the annotator&apos;s &ldquo;winner&rdquo; becomes the <strong>rejected</strong> sample —
                  so the reward model learns to assign lower scores to harmful outputs.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
