'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Annotation, Dimension, Prompt, RatingChoice, RatingScale } from '@/lib/types';

// Maps a rating choice to a compact badge label
function ratingLabel(r: RatingChoice, scale: RatingScale): string {
  if (r.choice === 'tie')      return scale === 'four_point' ? 'Negligible' : 'Tie';
  if (r.choice === 'both_bad') return 'Both Bad';
  if (r.choice === 'skip')     return 'Skip';

  const side = r.choice; // 'A' | 'B'
  if (scale === 'binary') return `Response ${side}`;

  const strength = r.strength;
  if (!strength || strength === 'negligibly') return `${side} (slight)`;
  if (strength === 'slightly')               return `${side} (slight)`;
  if (strength === 'better')                 return `${side} (better)`;
  if (strength === 'significantly')          return `${side} (sig. better)`;
  return `Response ${side}`;
}

function choiceVariant(choice: RatingChoice['choice']): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (choice === 'A') return 'default';
  if (choice === 'B') return 'secondary';
  if (choice === 'both_bad') return 'destructive';
  return 'outline';
}

interface AnnotationsTabProps {
  annotations: Annotation[];
  dimensions: Dimension[];
  prompts: Prompt[];
  ratingScale: RatingScale;
}

export function AnnotationsTab({ annotations, dimensions, prompts, ratingScale }: AnnotationsTabProps) {
  const [filterAnnotator, setFilterAnnotator] = useState('all');
  const [filterChoice, setFilterChoice] = useState('all');

  const promptMap = Object.fromEntries(prompts.map((p) => [p.id, p]));

  const uniqueAnnotators = [...new Set(annotations.map((a) => a.annotatorId))];

  const filtered = annotations.filter((a) => {
    if (filterAnnotator !== 'all' && a.annotatorId !== filterAnnotator) return false;
    if (filterChoice !== 'all') {
      const matches = a.ratings.some((r) => r.choice === filterChoice);
      if (!matches) return false;
    }
    return true;
  });

  if (annotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">No annotations collected yet.</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Start annotating from the <a href={`/annotate`} className="underline">Annotate</a> tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterAnnotator} onValueChange={setFilterAnnotator}>
          <SelectTrigger className="w-52 h-8 text-sm">
            <SelectValue placeholder="All annotators" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All annotators</SelectItem>
            {uniqueAnnotators.map((id) => (
              <SelectItem key={id} value={id}>{id.slice(0, 8)}…</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterChoice} onValueChange={setFilterChoice}>
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue placeholder="All choices" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All choices</SelectItem>
            <SelectItem value="A">Response A wins</SelectItem>
            <SelectItem value="B">Response B wins</SelectItem>
            <SelectItem value="tie">Tie</SelectItem>
            <SelectItem value="both_bad">Both Bad</SelectItem>
            <SelectItem value="skip">Skip</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground self-center">
          {filtered.length} of {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Annotator</TableHead>
              <TableHead>Prompt</TableHead>
              {dimensions.map((d) => (
                <TableHead key={d.id}>{d.label}</TableHead>
              ))}
              <TableHead>Comment</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((annotation) => {
              const prompt = promptMap[annotation.promptId];

              return (
                <TableRow key={annotation.id}>
                  <TableCell>
                    <div>
                      <p className="font-mono text-xs">{annotation.annotatorId.slice(0, 8)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="max-w-[200px] truncate text-sm cursor-default">
                            {prompt?.text ?? annotation.promptId}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-80 text-xs whitespace-pre-wrap">
                          {prompt?.text}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {dimensions.map((d) => {
                    const r = annotation.ratings.find((r) => r.dimensionId === d.id);
                    return (
                      <TableCell key={d.id}>
                        {r ? (
                          <Badge variant={choiceVariant(r.choice)} className="text-xs whitespace-nowrap">
                            {ratingLabel(r, ratingScale)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    {annotation.comment ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="max-w-[120px] truncate text-xs text-muted-foreground cursor-default">
                              {annotation.comment}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-64 text-xs">{annotation.comment}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(annotation.createdAt), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
