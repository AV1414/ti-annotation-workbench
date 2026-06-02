'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Keyboard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import type { Annotation, Task } from '@/lib/types';
import { submitAnnotationAction, resetAnnotationsAction } from '@/app/annotate/actions';

import { TaskFraming } from './TaskFraming';
import { PromptCard } from './PromptCard';
import { ResponseCard } from './ResponseCard';
import {
  RatingWidget,
  type RatingValue,
  FOUR_POINT_POSITIONS,
  valueToFourPointPos,
  fourPointPosToValue,
} from './RatingWidget';

// ── Helpers ────────────────────────────────────────────────────────────────

function getAnnotatorFromStorage(): { id: string; name: string } {
  if (typeof window === 'undefined') return { id: '', name: '' };
  let id = localStorage.getItem('annotatorId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('annotatorId', id);
  }
  const name = localStorage.getItem('annotatorName') ?? 'Anonymous Annotator';
  return { id, name };
}

// ── Completion screen ─────────────────────────────────────────────────────

function CompletionCard({
  task,
  sessionCount,
  totalAnnotated,
  annotatorId,
  onReset,
}: {
  task: Task;
  sessionCount: number;
  totalAnnotated: number;
  annotatorId: string;
  onReset: () => void;
}) {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!annotatorId || isResetting) return;
    setIsResetting(true);
    const result = await resetAnnotationsAction(task.id, annotatorId);
    setIsResetting(false);
    if (result.ok) {
      onReset();
    } else {
      toast.error(`Reset failed: ${result.error ?? 'Unknown error'}`);
    }
  };

  return (
    <div className="mx-auto max-w-md text-center space-y-6 py-16">
      <div className="text-5xl">🎉</div>
      <div>
        <h2 className="text-2xl font-bold">All done!</h2>
        <p className="mt-2 text-muted-foreground">
          You&apos;ve annotated all prompts in &ldquo;{task.name}&rdquo;.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4 text-left space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Annotated this session</span>
          <span className="font-medium tabular-nums">{sessionCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total annotations (all annotators)</span>
          <span className="font-medium tabular-nums">{totalAnnotated}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total prompts in task</span>
          <span className="font-medium tabular-nums">{task.prompts.length}</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="outline" asChild>
          <Link href="/annotate">Back to task list</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">View dashboard <ChevronRight className="size-4" /></Link>
        </Button>
      </div>
      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground mb-3">
          Want to re-annotate this task from scratch?
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          disabled={isResetting}
          onClick={handleReset}
        >
          {isResetting ? (
            <><Loader2 className="size-3 animate-spin" /> Resetting…</>
          ) : (
            'Reset my annotations'
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

interface AnnotationFormProps {
  task: Task;
  allAnnotations: Annotation[];
}

export function AnnotationForm({ task, allAnnotations: initialAnnotations }: AnnotationFormProps) {
  // Annotator identity
  const [annotatorId, setAnnotatorId] = useState('');
  const [annotatorName, setAnnotatorName] = useState('Anonymous Annotator');

  // Local annotation state — starts from server data, grows as user submits
  const [localAnnotations, setLocalAnnotations] = useState<Annotation[]>(initialAnnotations);

  // Per-prompt state
  const [ratings, setRatings] = useState<Record<string, RatingValue>>({});
  const [comment, setComment] = useState('');
  const [showSources, setShowSources] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  // Fade-in trigger — incrementing this key remounts the prompt content
  const [promptKey, setPromptKey] = useState(0);

  const commentRef = useRef<HTMLTextAreaElement>(null);

  // Read annotator from localStorage on mount
  useEffect(() => {
    const { id, name } = getAnnotatorFromStorage();
    setAnnotatorId(id);
    setAnnotatorName(name);
  }, []);

  // Compute queue
  const annotatedPromptIds = useMemo(
    () => new Set(localAnnotations.filter((a) => a.annotatorId === annotatorId).map((a) => a.promptId)),
    [localAnnotations, annotatorId],
  );

  const remainingPrompts = useMemo(
    () => task.prompts.filter((p) => !annotatedPromptIds.has(p.id)),
    [task.prompts, annotatedPromptIds],
  );

  const currentPrompt = remainingPrompts[0] ?? null;
  const totalDone = annotatedPromptIds.size;
  const totalPrompts = task.prompts.length;
  const isComplete = !currentPrompt;
  const isRatingTask = task.taskType === 'rating';

  const canSubmit = Object.values(ratings).some((v) => v !== null);

  // Rating setter for a single dimension
  const setRating = useCallback((dimensionId: string, value: RatingValue) => {
    setRatings((prev) => ({ ...prev, [dimensionId]: value }));
  }, []);

  // ── Submit / skip ───────────────────────────────────────────────────────

  const doSubmit = useCallback(async (skip = false) => {
    if (!currentPrompt || !annotatorId || isSubmitting) return;
    setIsSubmitting(true);

    const ratingChoices = task.dimensions.map((d) => {
      const v = skip ? null : ratings[d.id];
      if (!v) return { dimensionId: d.id, choice: 'skip' as const, strength: null };
      return { dimensionId: d.id, choice: v.choice, strength: v.strength ?? null };
    });

    const result = await submitAnnotationAction({
      taskId: task.id,
      promptId: currentPrompt.id,
      annotatorId,
      ratings: ratingChoices,
      comment: comment.trim() || undefined,
    });

    if (result.ok && result.annotation) {
      setLocalAnnotations((prev) => [...prev, result.annotation!]);
      setRatings({});
      setComment('');
      setSessionCount((n) => n + 1);
      setPromptKey((k) => k + 1);
    } else {
      toast.error(`Submission failed: ${result.error ?? 'Unknown error'}`);
    }

    setIsSubmitting(false);
  }, [currentPrompt, annotatorId, isSubmitting, task, ratings, comment]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return;
      if (!currentPrompt) return;

      // Quick-select for binary/preference: apply to all dimensions simultaneously
      const applyAll = (v: RatingValue) => {
        const next: Record<string, RatingValue> = {};
        task.dimensions.forEach((d) => { next[d.id] = v; });
        setRatings(next);
      };

      // Arrow navigation for positional scales
      const moveAll = (delta: -1 | 1) => {
        if (task.ratingScale === 'binary') return;
        setRatings((prev) => {
          const next = { ...prev };
          task.dimensions.forEach((d) => {
            const cur = prev[d.id];
            const curPos = cur ? (valueToFourPointPos(cur) ?? 3) : 3;
            const newPos = Math.max(0, Math.min(6, curPos + delta)) as 0|1|2|3|4|5|6;
            next[d.id] = fourPointPosToValue(newPos);
          });
          return next;
        });
      };

      switch (e.key) {
        case 'a': case 'A': applyAll({ choice: 'A', strength: task.ratingScale === 'binary' ? null : 'significantly' }); break;
        case 'b': case 'B': applyAll({ choice: 'B', strength: task.ratingScale === 'binary' ? null : 'significantly' }); break;
        case 't': case 'T': applyAll({ choice: 'tie', strength: task.ratingScale === 'binary' ? null : 'negligibly' }); break;
        case 'ArrowLeft':  e.preventDefault(); moveAll(-1); break;
        case 'ArrowRight': e.preventDefault(); moveAll(+1); break;
        case 'Enter': if (canSubmit && !isSubmitting) doSubmit(); break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPrompt, task, canSubmit, isSubmitting, doSubmit]);

  // ── Render ──────────────────────────────────────────────────────────────

  const totalAnnotatedGlobal = localAnnotations.length;

  if (isComplete && !annotatorId) {
    // Still hydrating — show nothing until annotatorId is known
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">

      {/* Sticky top bar */}
      <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/annotate"><ArrowLeft className="size-4" /> All tasks</Link>
          </Button>

          <div className="flex-1 flex items-center gap-2 overflow-hidden">
            <span className="truncate text-sm font-medium hidden sm:block">{task.name}</span>
            {task.dimensions.map((d) => (
              <Badge key={d.id} variant="secondary" className="hidden sm:inline-flex text-xs">
                {d.label}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {totalDone} / {totalPrompts}
            </span>
            <div className="w-24 h-1.5 overflow-hidden rounded-full bg-muted hidden sm:block">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${totalPrompts > 0 ? (totalDone / totalPrompts) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground hidden md:block">
              Annotating as <span className="font-medium">{annotatorName}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto w-full max-w-4xl px-4 py-8 flex-1">
        {isComplete ? (
          <CompletionCard
            task={task}
            sessionCount={sessionCount}
            totalAnnotated={totalAnnotatedGlobal}
            annotatorId={annotatorId}
            onReset={() => {
              setLocalAnnotations((prev) => prev.filter((a) => a.annotatorId !== annotatorId));
              setRatings({});
              setComment('');
              setSessionCount(0);
              setPromptKey((k) => k + 1);
            }}
          />
        ) : (
          // key prop triggers fade-in on each new prompt
          <div
            key={promptKey}
            className="space-y-6 animate-in fade-in duration-200"
          >
            <TaskFraming taskType={task.taskType} />

            <PromptCard text={currentPrompt!.text} />

            {/* Responses */}
            <div className={isRatingTask
              ? 'space-y-4'
              : 'flex flex-col md:flex-row gap-4'
            }>
              {isRatingTask
                ? currentPrompt!.responses.slice(0, 1).map((r) => (
                    <ResponseCard
                      key={r.id}
                      label="Response"
                      text={r.text}
                      showSource={showSources}
                      sourceLabel={r.model}
                    />
                  ))
                : currentPrompt!.responses.slice(0, 2).map((r, idx) => (
                    <ResponseCard
                      key={r.id}
                      label={`Response ${idx === 0 ? 'A' : 'B'}`}
                      text={r.text}
                      showSource={showSources}
                      sourceLabel={r.model}
                      isSelected={
                        Object.values(ratings).some((v) =>
                          v?.choice === (idx === 0 ? 'A' : 'B')
                        )
                      }
                    />
                  ))
              }
            </div>

            {/* Show sources toggle */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowSources((s) => !s)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showSources ? 'Hide' : 'Show'} response sources
              </button>
            </div>

            <Separator />

            {/* Rating dimensions */}
            <div className="space-y-8">
              {task.dimensions.map((dim) => (
                <RatingWidget
                  key={dim.id}
                  dimension={dim}
                  taskType={task.taskType}
                  ratingScale={task.ratingScale}
                  customScale={task.customScale}
                  value={ratings[dim.id] ?? null}
                  onChange={(v) => setRating(dim.id, v)}
                />
              ))}
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Optional notes about this comparison
              </label>
              <Textarea
                ref={commentRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Any observations, uncertainty, or edge-case notes…"
                className="resize-none"
                rows={2}
              />
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => doSubmit(true)}
                >
                  Skip this prompt
                </Button>

                <details className="group">
                  <summary className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground list-none">
                    <Keyboard className="size-3" />
                    Keyboard shortcuts
                  </summary>
                  <div className="absolute mt-2 z-50 rounded-md border bg-popover p-3 text-xs shadow-md space-y-1 w-72">
                    <p className="font-medium mb-2">Keyboard shortcuts</p>
                    <p><kbd className="rounded border px-1 font-mono">A</kbd> — Select Response A</p>
                    <p><kbd className="rounded border px-1 font-mono">B</kbd> — Select Response B</p>
                    <p><kbd className="rounded border px-1 font-mono">T</kbd> — Tie</p>
                    <p><kbd className="rounded border px-1 font-mono">← →</kbd> — Adjust strength (4-pt / Likert)</p>
                    <p><kbd className="rounded border px-1 font-mono">Enter</kbd> — Submit &amp; next</p>
                  </div>
                </details>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!canSubmit && (
                  <p className="text-xs text-muted-foreground">
                    Make a selection for at least one dimension to continue
                  </p>
                )}
                <Button
                  disabled={!canSubmit || isSubmitting}
                  onClick={() => doSubmit(false)}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting
                    ? <><Loader2 className="size-4 animate-spin" /> Saving…</>
                    : <>Submit &amp; Next</>
                  }
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
