'use client';

import { useState } from 'react';
import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Trash2, Plus, GripVertical, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GenerateDialog } from './generate-dialog';
import type { TaskFormValues } from './task-form';

interface PromptCardProps {
  control: Control<TaskFormValues>;
  register: UseFormRegister<TaskFormValues>;
  errors: FieldErrors<TaskFormValues>;
  nestIndex: number;
  onRemove: () => void;
  taskType: 'preference' | 'red_teaming' | 'rating';
  canRemovePrompt: boolean;
  hasApiKey: boolean;
  getPromptText: () => string;
  onReplaceResponses: (responses: Array<{ id: string; text: string; model: string }>) => void;
  onCostAdded: (cost: number, tokens: number) => void;
}

export function PromptCard({
  control,
  register,
  errors,
  nestIndex,
  onRemove,
  taskType,
  canRemovePrompt,
  hasApiKey,
  getPromptText,
  onReplaceResponses,
  onCostAdded,
}: PromptCardProps) {
  const [genOpen, setGenOpen] = useState(false);

  const { fields: responseFields, append: appendResponse, remove: removeResponse } = useFieldArray({
    control,
    name: `prompts.${nestIndex}.responses`,
  });

  const promptError = errors.prompts?.[nestIndex]?.text?.message;
  const responsesError = (errors.prompts?.[nestIndex]?.responses as { message?: string } | undefined)?.message;
  const minResponses = taskType === 'rating' ? 1 : 2;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-start gap-2">
        <GripVertical className="mt-2.5 size-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm font-medium">Prompt {nestIndex + 1}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!hasApiKey}
                    onClick={() => setGenOpen(true)}
                    className="h-7 px-3 text-xs gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="size-3" />
                    Generate Responses with AI
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
          <Textarea
            {...register(`prompts.${nestIndex}.text`)}
            placeholder="Enter the prompt / user turn text…"
            className="min-h-[80px] resize-y"
            aria-invalid={!!promptError}
          />
          {promptError && <p className="text-sm text-destructive">{promptError}</p>}
        </div>
        {canRemovePrompt && (
          <Button type="button" variant="ghost" size="icon" onClick={onRemove} className="mt-6 shrink-0">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        )}
      </div>

      <div className="ml-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Responses
          </p>
          {responsesError && <p className="text-xs text-destructive">{responsesError}</p>}
        </div>

        {responseFields.map((field, rIdx) => (
          <div key={field.id} className="rounded-md border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Response {String.fromCharCode(65 + rIdx)}
              </span>
              {responseFields.length > minResponses && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => removeResponse(rIdx)}
                >
                  <Trash2 className="size-3 text-destructive" />
                </Button>
              )}
            </div>
            <Textarea
              {...register(`prompts.${nestIndex}.responses.${rIdx}.text`)}
              placeholder="Response text…"
              className="min-h-[72px] resize-y"
              aria-invalid={!!errors.prompts?.[nestIndex]?.responses?.[rIdx]?.text}
            />
            {errors.prompts?.[nestIndex]?.responses?.[rIdx]?.text && (
              <p className="text-xs text-destructive">
                {errors.prompts[nestIndex].responses[rIdx].text.message}
              </p>
            )}
            <Input
              {...register(`prompts.${nestIndex}.responses.${rIdx}.model`)}
              placeholder="Source label (e.g. model_v1_temp_0.7) — optional"
              className="h-7 text-xs"
            />
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            appendResponse({ id: crypto.randomUUID(), text: '', model: '' })
          }
        >
          <Plus className="size-3.5" />
          Add Response
        </Button>
      </div>

      <GenerateDialog
        isOpen={genOpen}
        onClose={() => setGenOpen(false)}
        promptText={getPromptText()}
        hasApiKey={hasApiKey}
        onSave={onReplaceResponses}
        onCostAdded={onCostAdded}
      />
    </div>
  );
}
