'use client';

import { useRef, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { createTaskAction, updateTaskAction } from '../actions';
import { PromptCard } from './prompt-card';
import { BulkGenerateDialog } from './bulk-generate-dialog';
import type { Task } from '@/lib/types';

// ── Schema ────────────────────────────────────────────────────────────────

const dimensionSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Label is required'),
  description: z.string().optional(),
});

const responseSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Response text is required'),
  model: z.string().optional(),
});

const promptSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Prompt text is required'),
  responses: z.array(responseSchema),
});

const taskFormSchema = z.object({
  name: z.string().min(3, 'Task name must be at least 3 characters'),
  description: z.string().optional(),
  taskType: z.enum(['preference', 'red_teaming', 'rating']),
  ratingScale: z.enum(['binary', 'four_point', 'likert_7', 'custom']),
  customScale: z.array(z.object({ value: z.string() })).optional(),
  redTeamInvertSignal: z.boolean().optional(),
  dimensions: z.array(dimensionSchema).min(1, 'At least one dimension is required'),
  prompts: z.array(promptSchema).min(1, 'At least one prompt is required'),
  status: z.enum(['draft', 'active', 'completed']),
}).superRefine((data, ctx) => {
  const minResponses = data.taskType === 'rating' ? 1 : 2;
  data.prompts.forEach((prompt, i) => {
    if (prompt.responses.length < minResponses) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${data.taskType === 'rating' ? 'Rating' : 'Preference'} tasks need at least ${minResponses} response(s) per prompt`,
        path: ['prompts', i, 'responses'],
      });
    }
  });
  if (data.ratingScale === 'custom') {
    const labels = data.customScale?.filter((s) => s.value.trim()) ?? [];
    if (labels.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Custom scale requires at least 2 non-empty labels',
        path: ['customScale'],
      });
    }
  }
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

// ── Helpers ────────────────────────────────────────────────────────────────

const QUICK_DIMENSIONS = [
  { label: 'Helpfulness', description: "How well does the response address the user's request?" },
  { label: 'Safety', description: 'Does the response avoid harmful or dangerous content?' },
  { label: 'Factuality', description: 'Is the information accurate and well-grounded?' },
  { label: 'Conciseness', description: 'Is the response appropriately brief without losing substance?' },
];

function taskToFormValues(task: Task): TaskFormValues {
  return {
    name: task.name,
    description: task.description ?? '',
    taskType: task.taskType,
    ratingScale: task.ratingScale,
    customScale: task.customScale?.map((v) => ({ value: v })) ?? [],
    redTeamInvertSignal: task.redTeamInvertSignal ?? true,
    dimensions: task.dimensions.map((d) => ({ id: d.id, label: d.label, description: d.description ?? '' })),
    prompts: task.prompts.map((p) => ({
      id: p.id,
      text: p.text,
      responses: p.responses.map((r) => ({ id: r.id, text: r.text, model: r.model ?? '' })),
    })),
    status: task.status,
  };
}

const newTaskDefaults: TaskFormValues = {
  name: '',
  description: '',
  taskType: 'preference',
  ratingScale: 'binary',
  customScale: [],
  redTeamInvertSignal: true,
  dimensions: [{ id: crypto.randomUUID(), label: 'Helpfulness', description: "How well does the response address the user's request?" }],
  prompts: [{
    id: crypto.randomUUID(),
    text: '',
    responses: [
      { id: crypto.randomUUID(), text: '', model: '' },
      { id: crypto.randomUUID(), text: '', model: '' },
    ],
  }],
  status: 'draft',
};

// ── Component ──────────────────────────────────────────────────────────────

interface TaskFormProps {
  task?: Task;
  hasApiKey?: boolean;
}

export function TaskForm({ task, hasApiKey = false }: TaskFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [sessionCost, setSessionCost] = useState(0);
  const [sessionGenerations, setSessionGenerations] = useState(0);
  const submitStatusRef = useRef<'draft' | 'active' | 'completed'>('draft');

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: task ? taskToFormValues(task) : newTaskDefaults,
  });

  const { fields: dimensionFields, append: appendDimension, remove: removeDimension } = useFieldArray({
    control: form.control,
    name: 'dimensions',
  });

  const { fields: promptFields, append: appendPrompt, remove: removePrompt } = useFieldArray({
    control: form.control,
    name: 'prompts',
  });

  const { fields: customScaleFields, append: appendScale, remove: removeScale } = useFieldArray({
    control: form.control,
    name: 'customScale',
  });

  const taskType = form.watch('taskType');
  const ratingScale = form.watch('ratingScale');

  const handleCostAdded = useCallback((cost: number, _tokens: number) => {
    setSessionCost((c) => c + cost);
    setSessionGenerations((g) => g + 1);
  }, []);

  async function onSubmit(data: TaskFormValues) {
    setIsPending(true);
    const status = task ? data.status : submitStatusRef.current;

    const taskData: Omit<Task, 'id' | 'createdAt'> = {
      name: data.name,
      description: data.description || undefined,
      taskType: data.taskType,
      ratingScale: data.ratingScale,
      customScale: data.ratingScale === 'custom'
        ? data.customScale?.map((s) => s.value).filter(Boolean)
        : undefined,
      redTeamInvertSignal: data.taskType === 'red_teaming' ? data.redTeamInvertSignal : undefined,
      dimensions: data.dimensions.map((d) => ({
        id: d.id,
        label: d.label,
        description: d.description || undefined,
      })),
      prompts: data.prompts.map((p) => ({
        id: p.id,
        text: p.text,
        responses: p.responses.map((r) => ({
          id: r.id,
          text: r.text,
          model: r.model || undefined,
        })),
      })),
      status,
    };

    const result = task
      ? await updateTaskAction(task.id, taskData)
      : await createTaskAction(taskData);

    setIsPending(false);

    if (result.error) {
      toast.error(`Failed to save task: ${result.error}`);
    } else {
      toast.success(task ? 'Task updated' : 'Task created');
      router.push('/admin');
    }
  }

  function addQuickDimension(dim: typeof QUICK_DIMENSIONS[number]) {
    const already = dimensionFields.some((f) => f.label.toLowerCase() === dim.label.toLowerCase());
    if (!already) {
      appendDimension({ id: crypto.randomUUID(), label: dim.label, description: dim.description });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* ── Basic Info ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
            <CardDescription>Name and purpose of this annotation task.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Anthropic helpfulness pairs — Q3 batch" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What is this task collecting data for?"
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status — shown only on edit page */}
            {task && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* ── Task Configuration ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Task Configuration</CardTitle>
            <CardDescription>How annotators interact with this task.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-7">

            <FormField
              control={form.control}
              name="taskType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Type <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid gap-3 sm:grid-cols-3"
                    >
                      {[
                        {
                          value: 'preference',
                          label: 'Preference Comparison',
                          description: 'Annotators pick the better of two responses (Anthropic & Meta style)',
                        },
                        {
                          value: 'red_teaming',
                          label: 'Red Teaming',
                          description: 'Annotators pick the more harmful response; signal is inverted on export',
                        },
                        {
                          value: 'rating',
                          label: 'Free-form Rating',
                          description: 'Annotators rate a single response on the dimensions below',
                        },
                      ].map((opt) => (
                        <Label
                          key={opt.value}
                          htmlFor={`taskType-${opt.value}`}
                          className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5`}
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem id={`taskType-${opt.value}`} value={opt.value} />
                            <span className="text-sm font-medium">{opt.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-snug pl-6">{opt.description}</p>
                        </Label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ratingScale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating Scale <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full sm:w-80">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="binary">Binary (A or B)</SelectItem>
                      <SelectItem value="four_point">4-point margin scale (significantly / better / slightly / negligibly)</SelectItem>
                      <SelectItem value="likert_7">7-point Likert</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom scale labels */}
            {ratingScale === 'custom' && (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Custom Scale Labels</p>
                    <p className="text-xs text-muted-foreground">Add 2–7 labels in order (e.g. &quot;Strongly disagree&quot; → &quot;Strongly agree&quot;)</p>
                  </div>
                  <Badge variant="outline">{customScaleFields.length} / 7</Badge>
                </div>
                {customScaleFields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      {...form.register(`customScale.${idx}.value`)}
                      placeholder={`Label ${idx + 1}`}
                      className="h-8 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() => removeScale(idx)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
                {customScaleFields.length < 7 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendScale({ value: '' })}
                  >
                    <Plus className="size-3.5" /> Add Label
                  </Button>
                )}
                {form.formState.errors.customScale && (
                  <p className="text-sm text-destructive">
                    {(form.formState.errors.customScale as { message?: string }).message}
                  </p>
                )}
              </div>
            )}

            {/* Red team invert signal */}
            {taskType === 'red_teaming' && (
              <FormField
                control={form.control}
                name="redTeamInvertSignal"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 rounded-lg border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Invert Signal on Export
                      </FormLabel>
                      <FormDescription className="text-xs">
                        When enabled, the annotator&apos;s &ldquo;winner&rdquo; is exported as the{' '}
                        <em>rejected</em> response (Anthropic-style red-teaming, §1 of Bai et al. 2022)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* ── Dimensions ────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback Dimensions</CardTitle>
            <CardDescription>
              Define what annotators evaluate. At least one required; up to five.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <p className="text-xs text-muted-foreground self-center mr-1">Quick-add:</p>
              {QUICK_DIMENSIONS.map((dim) => (
                <Button
                  key={dim.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={dimensionFields.some((f) => f.label.toLowerCase() === dim.label.toLowerCase())}
                  onClick={() => addQuickDimension(dim)}
                >
                  <Plus className="size-3" /> {dim.label}
                </Button>
              ))}
            </div>
            <Separator />

            <div className="space-y-3">
              {dimensionFields.map((field, idx) => (
                <div key={field.id} className="flex gap-3 items-start rounded-lg border bg-muted/30 p-3">
                  <div className="flex-1 grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Label <span className="text-destructive">*</span></Label>
                      <Input
                        {...form.register(`dimensions.${idx}.label`)}
                        placeholder="e.g. Helpfulness"
                        className="h-8 text-sm"
                        aria-invalid={!!form.formState.errors.dimensions?.[idx]?.label}
                      />
                      {form.formState.errors.dimensions?.[idx]?.label && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.dimensions[idx].label.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description (optional)</Label>
                      <Input
                        {...form.register(`dimensions.${idx}.description`)}
                        placeholder="e.g. Does the response address the user's need?"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  {dimensionFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 mt-5 shrink-0"
                      onClick={() => removeDimension(idx)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {dimensionFields.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendDimension({ id: crypto.randomUUID(), label: '', description: '' })}
              >
                <Plus className="size-3.5" /> Add Dimension
              </Button>
            )}
            {form.formState.errors.dimensions?.root && (
              <p className="text-sm text-destructive">{form.formState.errors.dimensions.root.message}</p>
            )}
          </CardContent>
        </Card>

        {/* ── Prompts ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Prompts</CardTitle>
                <CardDescription className="mt-1">
                  Each prompt presents annotators with a user turn and{' '}
                  {taskType === 'rating' ? 'a response to rate' : 'two or more candidate responses to compare'}.
                </CardDescription>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!hasApiKey}
                      onClick={() => setBulkOpen(true)}
                      className="shrink-0 gap-1.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white disabled:opacity-50 shadow-sm"
                    >
                      <Sparkles className="size-3.5" />
                      Bulk Generate
                    </Button>
                  </TooltipTrigger>
                  {!hasApiKey && (
                    <TooltipContent side="left" className="max-w-xs text-xs">
                      Set ANTHROPIC_API_KEY in environment to enable live generation.
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {promptFields.map((field, idx) => (
              <PromptCard
                key={field.id}
                control={form.control}
                register={form.register}
                errors={form.formState.errors}
                nestIndex={idx}
                onRemove={() => removePrompt(idx)}
                taskType={taskType}
                canRemovePrompt={promptFields.length > 1}
                hasApiKey={hasApiKey}
                getPromptText={() => form.getValues(`prompts.${idx}.text`)}
                onReplaceResponses={(responses) => {
                  form.setValue(`prompts.${idx}.responses`, responses, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                onCostAdded={handleCostAdded}
              />
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                appendPrompt({
                  id: crypto.randomUUID(),
                  text: '',
                  responses: taskType === 'rating'
                    ? [{ id: crypto.randomUUID(), text: '', model: '' }]
                    : [
                        { id: crypto.randomUUID(), text: '', model: '' },
                        { id: crypto.randomUUID(), text: '', model: '' },
                      ],
                })
              }
            >
              <Plus className="size-4" /> Add Prompt
            </Button>

            {form.formState.errors.prompts?.root && (
              <p className="text-sm text-destructive">{form.formState.errors.prompts.root.message}</p>
            )}
          </CardContent>
        </Card>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-muted/30 px-6 py-4">
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </Link>
            <div className="flex gap-3">
              {task ? (
                <Button
                  type="submit"
                  disabled={isPending}
                  onClick={() => { submitStatusRef.current = form.getValues('status'); }}
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  Save Changes
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => {
                      submitStatusRef.current = 'draft';
                      form.handleSubmit(onSubmit)();
                    }}
                  >
                    {isPending && submitStatusRef.current === 'draft' && <Loader2 className="size-4 animate-spin" />}
                    Save as Draft
                  </Button>
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      submitStatusRef.current = 'active';
                      form.handleSubmit(onSubmit)();
                    }}
                  >
                    {isPending && submitStatusRef.current === 'active' && <Loader2 className="size-4 animate-spin" />}
                    Save and Activate
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Session budget indicator */}
          {sessionGenerations > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              API spend this session: ~${sessionCost.toFixed(5)} across {sessionGenerations} generation{sessionGenerations !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </form>

      <BulkGenerateDialog
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        hasApiKey={hasApiKey}
        taskType={taskType}
        onAdd={(prompt) => appendPrompt(prompt)}
        onCostAdded={handleCostAdded}
      />
    </Form>
  );
}
