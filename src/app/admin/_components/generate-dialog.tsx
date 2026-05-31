'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, ChevronDown, ChevronUp, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Pricing constants (rough estimates for display purposes) ─────────────────
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5': { input: 0.8 / 1_000_000, output: 4 / 1_000_000 },
  'claude-sonnet-4-5': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  'claude-opus-4-5': { input: 15 / 1_000_000, output: 75 / 1_000_000 },
};

function calcCost(
  usage: { input_tokens: number; output_tokens: number },
  model: string,
): number {
  const p = PRICING[model] ?? PRICING['claude-haiku-4-5'];
  return usage.input_tokens * p.input + usage.output_tokens * p.output;
}

// ── Temperature slider ────────────────────────────────────────────────────────
function TempSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0.0 — precise</span>
        <span className="font-semibold text-foreground tabular-nums">{value.toFixed(1)}</span>
        <span>creative — 1.0</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-primary cursor-pointer"
      />
    </div>
  );
}

// ── Config panel for one response ─────────────────────────────────────────────
interface PanelConfig {
  model: string;
  temperature: number;
  systemPrompt: string;
}

function ConfigPanel({
  label,
  config,
  onChange,
}: {
  label: string;
  config: PanelConfig;
  onChange: (patch: Partial<PanelConfig>) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
      <p className="text-sm font-semibold">{label}</p>

      <div className="space-y-1.5">
        <Label className="text-xs">Model</Label>
        <Select value={config.model} onValueChange={(v) => onChange({ model: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claude-haiku-4-5">claude-haiku-4-5 — fast &amp; cheap</SelectItem>
            <SelectItem value="claude-sonnet-4-5">claude-sonnet-4-5 — balanced</SelectItem>
            <SelectItem value="claude-opus-4-5">claude-opus-4-5 — most capable</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          Different models produce different response styles — useful for diverse training pairs.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Temperature</Label>
        <TempSlider value={config.temperature} onChange={(v) => onChange({ temperature: v })} />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          {showAdvanced ? 'Hide' : 'Show'} advanced
        </button>
        {showAdvanced && (
          <div className="mt-2 space-y-1.5">
            <Label className="text-xs">System Prompt (optional)</Label>
            <Textarea
              placeholder="Optional steering instructions to shape this response"
              value={config.systemPrompt}
              onChange={(e) => onChange({ systemPrompt: e.target.value })}
              className="min-h-[60px] text-xs resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Result card ────────────────────────────────────────────────────────────────
interface ResultState {
  text: string;
  model: string;
  temperature: number;
  usage: { input_tokens: number; output_tokens: number };
  editedText: string;
  isEditing: boolean;
  isSelected: boolean;
}

function ResultCard({
  label,
  result,
  onChange,
}: {
  label: string;
  result: ResultState;
  onChange: (patch: Partial<ResultState>) => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`use-${label}`}
            checked={result.isSelected}
            onCheckedChange={(v) => onChange({ isSelected: !!v })}
          />
          <Label htmlFor={`use-${label}`} className="text-sm font-semibold cursor-pointer">
            {label}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            {result.model} · temp {result.temperature.toFixed(1)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              if (result.isEditing) {
                onChange({ isEditing: false, text: result.editedText });
              } else {
                onChange({ isEditing: true, editedText: result.text });
              }
            }}
          >
            {result.isEditing ? (
              <>
                <Check className="size-3 mr-1" /> Done
              </>
            ) : (
              <>
                <Pencil className="size-3 mr-1" /> Edit
              </>
            )}
          </Button>
        </div>
      </div>

      {result.isEditing ? (
        <Textarea
          value={result.editedText}
          onChange={(e) => onChange({ editedText: e.target.value })}
          className="min-h-[100px] text-sm resize-y"
          autoFocus
        />
      ) : (
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{result.text}</p>
      )}
    </div>
  );
}

// ── Main dialog ────────────────────────────────────────────────────────────────

interface GenerateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  promptText: string;
  hasApiKey: boolean;
  onSave: (responses: Array<{ id: string; text: string; model: string }>) => void;
  onCostAdded: (cost: number, tokens: number) => void;
}

const DEFAULT_CONFIG_A: PanelConfig = {
  model: 'claude-haiku-4-5',
  temperature: 0.3,
  systemPrompt: '',
};
const DEFAULT_CONFIG_B: PanelConfig = {
  model: 'claude-haiku-4-5',
  temperature: 1.0,
  systemPrompt: 'Be concise. Respond in fewer than 100 words.',
};

export function GenerateDialog({
  isOpen,
  onClose,
  promptText,
  hasApiKey,
  onSave,
  onCostAdded,
}: GenerateDialogProps) {
  const [configA, setConfigA] = useState<PanelConfig>(DEFAULT_CONFIG_A);
  const [configB, setConfigB] = useState<PanelConfig>(DEFAULT_CONFIG_B);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultA, setResultA] = useState<ResultState | null>(null);
  const [resultB, setResultB] = useState<ResultState | null>(null);

  const totalUsage =
    resultA && resultB
      ? {
          input_tokens: resultA.usage.input_tokens + resultB.usage.input_tokens,
          output_tokens: resultA.usage.output_tokens + resultB.usage.output_tokens,
        }
      : null;

  const totalCost =
    resultA && resultB
      ? calcCost(resultA.usage, resultA.model) + calcCost(resultB.usage, resultB.model)
      : 0;

  async function handleGenerate() {
    if (!promptText.trim()) {
      toast.error('Enter a prompt before generating responses.');
      return;
    }

    setIsGenerating(true);
    setResultA(null);
    setResultB(null);

    try {
      const res = await fetch('/api/generate-pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          configA: {
            model: configA.model,
            temperature: configA.temperature,
            systemPrompt: configA.systemPrompt || undefined,
          },
          configB: {
            model: configB.model,
            temperature: configB.temperature,
            systemPrompt: configB.systemPrompt || undefined,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          toast.error('Rate limit reached. Wait a minute and try again.');
        } else {
          toast.error(`Generation failed: ${data.error ?? 'Unknown error'}`);
        }
        return;
      }

      const a: ResultState = {
        ...data.responseA,
        editedText: data.responseA.text,
        isEditing: false,
        isSelected: true,
      };
      const b: ResultState = {
        ...data.responseB,
        editedText: data.responseB.text,
        isEditing: false,
        isSelected: true,
      };

      setResultA(a);
      setResultB(b);

      const inputT = a.usage.input_tokens + b.usage.input_tokens;
      const outputT = a.usage.output_tokens + b.usage.output_tokens;
      const cost = calcCost(a.usage, a.model) + calcCost(b.usage, b.model);

      onCostAdded(cost, inputT + outputT);
      toast.success(
        `Generated 2 responses (${inputT + outputT} tokens, ~$${cost.toFixed(5)})`,
      );
    } catch {
      toast.error('Generation failed: network error');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSave() {
    const responses: Array<{ id: string; text: string; model: string }> = [];
    if (resultA?.isSelected) {
      const text = resultA.isEditing ? resultA.editedText : resultA.text;
      responses.push({
        id: crypto.randomUUID(),
        text,
        model: `${resultA.model}@t${resultA.temperature.toFixed(1)}`,
      });
    }
    if (resultB?.isSelected) {
      const text = resultB.isEditing ? resultB.editedText : resultB.text;
      responses.push({
        id: crypto.randomUUID(),
        text,
        model: `${resultB.model}@t${resultB.temperature.toFixed(1)}`,
      });
    }
    if (!responses.length) {
      toast.error('Select at least one response to save.');
      return;
    }
    onSave(responses);
    onClose();
  }

  function handleClose() {
    setResultA(null);
    setResultB(null);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Response Pair</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Prompt preview */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Prompt</Label>
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">
              {promptText || <em>No prompt text yet</em>}
            </div>
          </div>

          {/* Config panels */}
          <div className="grid gap-4 sm:grid-cols-2">
            <ConfigPanel
              label="Response A Configuration"
              config={configA}
              onChange={(p) => setConfigA((c) => ({ ...c, ...p }))}
            />
            <ConfigPanel
              label="Response B Configuration"
              config={configB}
              onChange={(p) => setConfigB((c) => ({ ...c, ...p }))}
            />
          </div>

          {/* Generate button */}
          <Button
            type="button"
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
            disabled={isGenerating || !hasApiKey}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Generating…
              </>
            ) : (
              '✨ Generate'
            )}
          </Button>

          {/* Loading skeletons */}
          {isGenerating && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-lg border p-4 space-y-3 animate-pulse">
                  <div className="h-4 w-1/3 bg-muted rounded" />
                  <div className="h-3 w-full bg-muted rounded" />
                  <div className="h-3 w-5/6 bg-muted rounded" />
                  <div className="h-3 w-4/5 bg-muted rounded" />
                  <div className="h-3 w-2/3 bg-muted rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {resultA && resultB && !isGenerating && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <ResultCard
                  label="Response A"
                  result={resultA}
                  onChange={(p) => setResultA((r) => r && { ...r, ...p })}
                />
                <ResultCard
                  label="Response B"
                  result={resultB}
                  onChange={(p) => setResultB((r) => r && { ...r, ...p })}
                />
              </div>

              {/* Token usage + cost */}
              {totalUsage && (
                <p className="text-xs text-muted-foreground text-center">
                  Used {totalUsage.input_tokens} input + {totalUsage.output_tokens} output tokens
                  — approximately{' '}
                  <span className="font-medium text-foreground">${totalCost.toFixed(5)}</span>
                </p>
              )}

              {/* Save / Regenerate / Cancel */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    Regenerate
                  </Button>
                  <Button type="button" onClick={handleSave}>
                    Save to Prompt
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* No-key message */}
          {!hasApiKey && (
            <p className="text-xs text-amber-600 text-center">
              Set ANTHROPIC_API_KEY in environment to enable live generation.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
