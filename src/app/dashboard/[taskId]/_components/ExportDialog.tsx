'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import type { ExportStats } from '@/lib/export';

interface ExportDialogProps {
  taskId: string;
  stats: ExportStats;
}

export function ExportDialog({ taskId, stats }: ExportDialogProps) {
  const [style, setStyle] = useState<'trl' | 'raw'>('trl');
  const [previewLines, setPreviewLines] = useState<string[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchPreview = useCallback(async (s: 'trl' | 'raw') => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`/api/export/${taskId}?format=jsonl&style=${s}&preview=2`);
      const data = await res.json();
      setPreviewLines(data.lines ?? []);
    } catch {
      setPreviewLines([]);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [taskId]);

  useEffect(() => { fetchPreview('trl'); }, [fetchPreview]);

  const handleStyleChange = (s: 'trl' | 'raw') => {
    setStyle(s);
    fetchPreview(s);
  };

  const handleDownload = () => {
    window.open(`/api/export/${taskId}?format=jsonl&style=${style}`, '_blank');
  };

  const curlCommand = `curl "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/export/${taskId}?format=jsonl&style=${style}" -o export.jsonl`;

  const handleCopyCurl = async () => {
    await navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    toast.success('curl command copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const totalLines = style === 'trl' ? stats.trlLines : stats.rawLines;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Download className="size-4" />
          Export JSONL
        </Button>
      </DialogTrigger>

      {/* Bug 4: flex-col + max-h so header/footer pin and body scrolls */}
      <DialogContent className="max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Export Annotations as JSONL</DialogTitle>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-5 py-1">

          {/* Bug 1: stack radio options vertically */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Format</Label>
            <RadioGroup
              value={style}
              onValueChange={(v) => handleStyleChange(v as 'trl' | 'raw')}
              className="flex flex-col gap-3"
            >
              <div className="flex items-start gap-2">
                <RadioGroupItem value="trl" id="style-trl" className="mt-0.5 shrink-0" />
                <Label htmlFor="style-trl" className="font-normal cursor-pointer leading-snug">
                  TRL-compatible{' '}
                  <span className="text-muted-foreground text-xs">(default — chosen/rejected pairs, margin terms)</span>
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="raw" id="style-raw" className="mt-0.5 shrink-0" />
                <Label htmlFor="style-raw" className="font-normal cursor-pointer leading-snug">
                  Raw annotations{' '}
                  <span className="text-muted-foreground text-xs">(includes skips and both-bad)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Bug 2: explicit text-foreground on values so they're never invisible */}
          <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Annotations</span>
              <span className="font-medium tabular-nums text-foreground">{stats.totalAnnotations}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Dimensions</span>
              <span className="font-medium tabular-nums text-foreground">{stats.totalDimensions}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Export lines ({style === 'trl' ? 'TRL' : 'raw'})</span>
              <span className="font-medium tabular-nums text-foreground">{totalLines}</span>
            </div>
            {style === 'trl' && (
              <div className="flex justify-between gap-4 text-muted-foreground">
                <span>Skips &amp; Both Bad (excluded)</span>
                <span className="tabular-nums">{stats.excludedCount}</span>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preview (first 2 lines)</Label>
            <div className="relative rounded-lg border bg-muted/30 overflow-hidden">
              {isLoadingPreview ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : previewLines.length > 0 ? (
                <pre className="overflow-x-auto p-3 text-[11px] leading-relaxed font-mono">
                  {previewLines.map((line, i) => (
                    <div key={i}>
                      <span className="select-none text-muted-foreground/50 mr-2">{i + 1}</span>
                      {line}
                    </div>
                  ))}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-16">
                  <p className="text-sm text-muted-foreground">No exportable annotations yet</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* curl command */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">API / curl</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded border bg-muted px-3 py-2 text-[11px] font-mono overflow-x-auto whitespace-nowrap">
                {curlCommand}
              </code>
              <Button variant="outline" size="icon" className="shrink-0" onClick={handleCopyCurl} title="Copy curl command">
                {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>

          <p className="text-center text-[11px] text-muted-foreground pb-1">
            Schema follows HuggingFace TRL conventions. Compatible with{' '}
            <code>trl.DPOTrainer</code>, <code>trl.RewardTrainer</code>, and standard preference-data pipelines.
          </p>
        </div>

        {/* Bug 3: proper DialogFooter with all three visible action buttons */}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button variant="outline" onClick={handleCopyCurl}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            Copy curl command
          </Button>
          <Button onClick={handleDownload} disabled={totalLines === 0}>
            <Download className="size-4" />
            Download JSONL{totalLines > 0 ? ` (${totalLines} lines)` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
