import { Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Annotation, Dimension, Prompt, RatingScale } from '@/lib/types';

interface PromptAgreement {
  prompt: Prompt;
  annotations: Annotation[];
  dimensionAgreement: {
    dimension: Dimension;
    exactMatch: number;
    directional: number;
    total: number;
  }[];
}

function isDirectionalMatch(a: string, b: string): boolean {
  // A/B choices directionally agree if both prefer A, both prefer B, or both tie
  if (a === b) return true;
  // 'significantly'/'better'/'slightly' for same choice still directional match
  return false; // for now exact match per choice side is sufficient
}

function computeAgreement(
  annotations: Annotation[],
  dimensions: Dimension[],
  ratingScale: RatingScale,
): PromptAgreement[] {
  // Group by prompt
  const promptGroups = new Map<string, Annotation[]>();
  for (const a of annotations) {
    const group = promptGroups.get(a.promptId) ?? [];
    group.push(a);
    promptGroups.set(a.promptId, group);
  }

  const results: PromptAgreement[] = [];

  for (const [, group] of promptGroups) {
    if (group.length < 2) continue;
    // Require at least 2 different annotators
    const uniqueAnnotators = new Set(group.map((a) => a.annotatorId));
    if (uniqueAnnotators.size < 2) continue;

    const dimensionAgreement = dimensions.map((dim) => {
      const dimRatings = group
        .map((a) => a.ratings.find((r) => r.dimensionId === dim.id))
        .filter(Boolean) as { choice: string; strength?: string | null }[];

      if (dimRatings.length < 2) {
        return { dimension: dim, exactMatch: 0, directional: 0, total: 0 };
      }

      let exactMatches = 0;
      let directionalMatches = 0;
      let pairs = 0;

      for (let i = 0; i < dimRatings.length; i++) {
        for (let j = i + 1; j < dimRatings.length; j++) {
          const a = dimRatings[i];
          const b = dimRatings[j];
          pairs++;
          if (a.choice === b.choice) exactMatches++;
          // Directional: same winner regardless of strength
          const aDir = a.choice === 'A' ? 'A' : a.choice === 'B' ? 'B' : 'tie';
          const bDir = b.choice === 'A' ? 'A' : b.choice === 'B' ? 'B' : 'tie';
          if (aDir === bDir) directionalMatches++;
        }
      }

      return {
        dimension: dim,
        exactMatch: pairs > 0 ? Math.round((exactMatches / pairs) * 100) : 0,
        directional: pairs > 0 ? Math.round((directionalMatches / pairs) * 100) : 0,
        total: pairs,
      };
    });

    results.push({ prompt: { id: group[0].promptId, text: '', responses: [] }, annotations: group, dimensionAgreement });
  }

  return results;
}

interface AgreementTabProps {
  annotations: Annotation[];
  dimensions: Dimension[];
  prompts: Prompt[];
  ratingScale: RatingScale;
}

export function AgreementTab({ annotations, dimensions, prompts, ratingScale }: AgreementTabProps) {
  const promptMap = Object.fromEntries(prompts.map((p) => [p.id, p]));
  const agreement = computeAgreement(annotations, dimensions, ratingScale);

  const hasData = agreement.length > 0;

  return (
    <div className="space-y-5">
      {/* Explainer */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm space-y-1">
        <div className="flex items-center gap-2 font-medium">
          <Info className="size-4 text-muted-foreground" />
          Inter-Annotator Agreement
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Anthropic reported ~63% researcher–crowdworker label agreement (Bai et al. 2022 §A.4).
          Below 70% suggests rubric ambiguity or task complexity worth investigating.
          &ldquo;Exact&rdquo; = same response chosen; &ldquo;Directional&rdquo; = same winner regardless of strength (relevant for 4-point / Likert scales).
        </p>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">No prompts with multiple annotators yet.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            This tab appears when at least one prompt has been annotated by 2+ different annotators.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prompt</TableHead>
                <TableHead className="text-center">Annotators</TableHead>
                {dimensions.map((d) => (
                  <TableHead key={d.id} className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="underline decoration-dashed">{d.label}</TooltipTrigger>
                        <TooltipContent className="text-xs">Exact / Directional agreement</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {agreement.map((row) => {
                const prompt = promptMap[row.annotations[0].promptId];
                const uniqueAnnotators = new Set(row.annotations.map((a) => a.annotatorId)).size;

                return (
                  <TableRow key={row.annotations[0].promptId}>
                    <TableCell>
                      <p className="max-w-[200px] truncate text-sm">
                        {prompt?.text ?? row.annotations[0].promptId}
                      </p>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{uniqueAnnotators}</TableCell>
                    {row.dimensionAgreement.map((da) => (
                      <TableCell key={da.dimension.id} className="text-center">
                        <div className="space-y-0.5">
                          <Badge
                            variant={da.exactMatch >= 70 ? 'default' : da.exactMatch >= 50 ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {da.exactMatch}% exact
                          </Badge>
                          {ratingScale !== 'binary' && (
                            <p className="text-[10px] text-muted-foreground">{da.directional}% directional</p>
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
