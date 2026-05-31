'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Pricing constants (mirrors generate-dialog.tsx) ──────────────────────────
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5': { input: 0.8 / 1_000_000, output: 4 / 1_000_000 },
  'claude-sonnet-4-5': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  'claude-opus-4-5': { input: 15 / 1_000_000, output: 75 / 1_000_000 },
};
function calcCost(usage: { input_tokens: number; output_tokens: number }, model: string) {
  const p = PRICING[model] ?? PRICING['claude-haiku-4-5'];
  return usage.input_tokens * p.input + usage.output_tokens * p.output;
}

// ── Temp slider (local copy to avoid cross-file dep) ─────────────────────────
function TempSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0.0</span>
        <span className="font-semibold text-foreground tabular-nums">{value.toFixed(1)}</span>
        <span>1.0</span>
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
  onChange: (p: Partial<PanelConfig>) => void;
}) {
  const [showAdv, setShowAdv] = useState(false);
  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      <p className="text-xs font-semibold">{label}</p>
      <div className="space-y-1">
        <Label className="text-xs">Model</Label>
        <Select value={config.model} onValueChange={(v) => onChange({ model: v })}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claude-haiku-4-5">claude-haiku-4-5</SelectItem>
            <SelectItem value="claude-sonnet-4-5">claude-sonnet-4-5</SelectItem>
            <SelectItem value="claude-opus-4-5">claude-opus-4-5</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Temperature</Label>
        <TempSlider value={config.temperature} onChange={(v) => onChange({ temperature: v })} />
      </div>
      <button
        type="button"
        onClick={() => setShowAdv((s) => !s)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showAdv ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        {showAdv ? 'Hide' : 'Show'} system prompt
      </button>
      {showAdv && (
        <Textarea
          value={config.systemPrompt}
          onChange={(e) => onChange({ systemPrompt: e.target.value })}
          placeholder="Optional system prompt"
          className="text-xs min-h-[50px] resize-none mt-1"
        />
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface BulkGenerateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hasApiKey: boolean;
  taskType: 'preference' | 'red_teaming' | 'rating';
  onAdd: (prompt: { id: string; text: string; responses: Array<{ id: string; text: string; model: string }> }) => void;
  onCostAdded: (cost: number, tokens: number) => void;
}

function parsePrompts(raw: string): string[] {
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      // fall through to newline parse
    }
  }
  return trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
}

export function BulkGenerateDialog({
  isOpen,
  onClose,
  hasApiKey,
  taskType,
  onAdd,
  onCostAdded,
}: BulkGenerateDialogProps) {
  const [promptsRaw, setPromptsRaw] = useState('');
  const [configA, setConfigA] = useState<PanelConfig>({
    model: 'claude-haiku-4-5',
    temperature: 0.3,
    systemPrompt: '',
  });
  const [configB, setConfigB] = useState<PanelConfig>({
    model: 'claude-haiku-4-5',
    temperature: 1.0,
    systemPrompt: 'Be concise. Respond in fewer than 100 words.',
  });
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const stoppedRef = useRef(false);

  const prompts = parsePrompts(promptsRaw);

  async function handleGenerateAll() {
    if (!prompts.length) {
      toast.error('Paste at least one prompt.');
      return;
    }
    stoppedRef.current = false;
    setIsRunning(true);
    setProgress({ done: 0, total: prompts.length });

    let totalCost = 0;
    let totalTokens = 0;

    for (let i = 0; i < prompts.length; i++) {
      if (stoppedRef.current) break;

      const promptText = prompts[i];
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
            toast.error('Rate limit reached. Generation paused.');
            break;
          }
          toast.error(`Failed on prompt ${i + 1}: ${data.error}`);
          break;
        }

        const cost =
          calcCost(data.responseA.usage, data.responseA.model) +
          calcCost(data.responseB.usage, data.responseB.model);
        const tokens =
          data.responseA.usage.input_tokens +
          data.responseA.usage.output_tokens +
          data.responseB.usage.input_tokens +
          data.responseB.usage.output_tokens;
        totalCost += cost;
        totalTokens += tokens;

        const responses = [
          {
            id: crypto.randomUUID(),
            text: data.responseA.text,
            model: `${data.responseA.model}@t${data.responseA.temperature.toFixed(1)}`,
          },
          {
            id: crypto.randomUUID(),
            text: data.responseB.text,
            model: `${data.responseB.model}@t${data.responseB.temperature.toFixed(1)}`,
          },
        ];

        // Rating tasks only need one response; keep both for preference/red_teaming
        onAdd({
          id: crypto.randomUUID(),
          text: promptText,
          responses: taskType === 'rating' ? responses.slice(0, 1) : responses,
        });

        setProgress({ done: i + 1, total: prompts.length });
      } catch {
        toast.error(`Network error on prompt ${i + 1}`);
        break;
      }
    }

    setIsRunning(false);

    if (totalTokens > 0) {
      onCostAdded(totalCost, totalTokens);
      const done = stoppedRef.current
        ? `Stopped after ${progress.done} prompts`
        : `Generated ${prompts.length} prompts`;
      toast.success(`${done} (${totalTokens} tokens, ~$${totalCost.toFixed(5)})`);
    }

    if (!stoppedRef.current) {
      onClose();
    }
  }

  function handleStop() {
    stoppedRef.current = true;
  }

  function handleClose() {
    if (!isRunning) {
      setPromptsRaw('');
      setProgress({ done: 0, total: 0 });
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Generate from Prompt List</DialogTitle>
          <DialogDescription>
            Each prompt gets two AI-generated candidate responses — directly implementing the
            §3.2.1 response diversity strategy from Touvron et al. 2023.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm">Prompts</Label>
            <Textarea
              placeholder={'Paste prompts, one per line (or as JSON array)\n\nExample:\nExplain quantum entanglement to a 10-year-old\nWhat is the best way to learn piano?\nDescribe the water cycle'}
              value={promptsRaw}
              onChange={(e) => setPromptsRaw(e.target.value)}
              className="min-h-[120px] resize-y font-mono text-xs"
              disabled={isRunning}
            />
            {prompts.length > 0 && (
              <p className="text-xs text-muted-foreground">{prompts.length} prompt{prompts.length !== 1 ? 's' : ''} parsed</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ConfigPanel
              label="Response A"
              config={configA}
              onChange={(p) => setConfigA((c) => ({ ...c, ...p }))}
            />
            <ConfigPanel
              label="Response B"
              config={configB}
              onChange={(p) => setConfigB((c) => ({ ...c, ...p }))}
            />
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Generating {progress.done + 1} of {progress.total}…</span>
                <span>{Math.round((progress.done / progress.total) * 100)}%</span>
              </div>
              <Progress value={(progress.done / progress.total) * 100} className="h-2" />
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isRunning}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            {isRunning ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleStop}
                className="gap-2"
              >
                <Square className="size-3.5" /> Stop
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!hasApiKey || !prompts.length}
                onClick={handleGenerateAll}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-2"
              >
                {isRunning && <Loader2 className="size-4 animate-spin" />}
                ✨ Generate All ({prompts.length} prompt{prompts.length !== 1 ? 's' : ''})
              </Button>
            )}
          </div>

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
