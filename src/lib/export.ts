import type { Task, Annotation, RatingChoice, RatingScale } from './types';

// ── Margin calculation ─────────────────────────────────────────────────────
// Implements the margin-loss preference signal from Touvron et al. 2023 §3.2.2
// (Equation 2): stronger preference produces a larger margin term for RM training.

function choiceToFourPointPos(rating: RatingChoice): number {
  // Maps a RatingChoice to a 0–6 positional index
  // 0 = A significantly better … 3 = Tie … 6 = B significantly better
  if (rating.choice === 'A') {
    switch (rating.strength) {
      case 'significantly': return 0;
      case 'better':        return 1;
      case 'slightly':      return 2;
      default:              return 2;
    }
  }
  if (rating.choice === 'B') {
    switch (rating.strength) {
      case 'significantly': return 6;
      case 'better':        return 5;
      case 'slightly':      return 4;
      default:              return 4;
    }
  }
  return 3; // tie / negligibly
}

export function computeMargin(
  scale: RatingScale,
  rating: RatingChoice,
  customScaleLen: number,
): number {
  switch (scale) {
    case 'binary':
      // Binary scale: flat margin = 1.0 (no gradation)
      return 1.0;

    case 'four_point': {
      // Touvron et al. 2023 §3.2.2 Eq. 2: margin ∝ preference strength
      const MAP: Record<string, number> = {
        significantly: 1.0,
        better:        0.66,
        slightly:      0.33,
        negligibly:    0.0,
      };
      return MAP[rating.strength ?? 'significantly'] ?? 1.0;
    }

    case 'likert_7': {
      // 7-point scale: margin = |position − center| / center, so margin ∈ [0, 1]
      const pos = choiceToFourPointPos(rating); // reuse same 0–6 mapping
      return Math.abs(pos - 3) / 3;
    }

    case 'custom': {
      // Custom N-label scale: reverse-map via 4-point positions, then normalize
      const pos = choiceToFourPointPos(rating);
      const n = Math.max(customScaleLen, 2);
      return Math.abs(pos - 3) / 3; // same formula — internal positions map 0–6
    }
  }
}

// ── TRL preference line ───────────────────────────────────────────────────

export interface TrlLine {
  prompt: string;
  chosen: string;
  rejected: string;
  margin: number;
  dimension: string;
  annotator_id: string;
  task_id: string;
  task_name: string;
  rating_scale: RatingScale;
  metadata: {
    prompt_id: string;
    annotated_at: string;
    task_type: Task['taskType'];
    red_team_inverted: boolean;
  };
}

export interface RatingLine {
  prompt: string;
  response: string;
  rating: number;
  rating_normalized: number;
  dimension: string;
  annotator_id: string;
  task_id: string;
  rating_scale: RatingScale;
  metadata: {
    prompt_id: string;
    annotated_at: string;
    task_type: 'rating';
  };
}

// ── Export helpers ────────────────────────────────────────────────────────

function ratingToScore(rating: RatingChoice): number {
  // Maps any rating to a 1–7 integer score (for rating tasks)
  const pos = choiceToFourPointPos(rating); // 0–6
  return pos + 1; // 1–7
}

function isExcludedFromTrl(choice: RatingChoice['choice']): boolean {
  return choice === 'skip' || choice === 'both_bad';
}

// ── Core export logic ─────────────────────────────────────────────────────

export interface ExportOptions {
  style: 'trl' | 'raw';
  limit?: number; // for preview
}

export function generateExportLines(
  task: Task,
  annotations: Annotation[],
  options: ExportOptions,
): string[] {
  const lines: string[] = [];
  const isRating = task.taskType === 'rating';

  for (const annotation of annotations) {
    const prompt = task.prompts.find((p) => p.id === annotation.promptId);
    if (!prompt) continue;

    for (const rating of annotation.ratings) {
      const dimension = task.dimensions.find((d) => d.id === rating.dimensionId);
      if (!dimension) continue;

      if (options.style === 'raw') {
        // Raw: include everything as-is
        lines.push(JSON.stringify({
          annotation_id: annotation.id,
          task_id: task.id,
          task_name: task.name,
          task_type: task.taskType,
          prompt: prompt.text,
          prompt_id: prompt.id,
          dimension: dimension.label,
          dimension_id: dimension.id,
          annotator_id: annotation.annotatorId,
          rating: rating,
          comment: annotation.comment,
          annotated_at: annotation.createdAt,
          rating_scale: task.ratingScale,
        }));
      } else if (isRating) {
        // TRL format — rating tasks
        if (isExcludedFromTrl(rating.choice)) continue;
        const response = prompt.responses[0];
        if (!response) continue;

        const score = ratingToScore(rating);
        const line: RatingLine = {
          prompt: prompt.text,
          response: response.text,
          rating: score,
          rating_normalized: (score - 1) / 6, // 0–1
          dimension: dimension.label,
          annotator_id: annotation.annotatorId,
          task_id: task.id,
          rating_scale: task.ratingScale,
          metadata: {
            prompt_id: prompt.id,
            annotated_at: annotation.createdAt,
            task_type: 'rating',
          },
        };
        lines.push(JSON.stringify(line));
      } else {
        // TRL format — preference / red-teaming tasks
        if (isExcludedFromTrl(rating.choice)) continue;

        const responseA = prompt.responses[0];
        const responseB = prompt.responses[1];
        if (!responseA || !responseB) continue;

        const margin = computeMargin(task.ratingScale, rating, task.customScale?.length ?? 2);

        // Red-teaming inversion: Bai et al. 2022 §1 footnote 4.
        // The annotator picks the MORE HARMFUL response. We invert so that
        // the harmful response becomes `rejected` and the safer one becomes `chosen`.
        const invert = task.taskType === 'red_teaming' && task.redTeamInvertSignal === true;

        let chosenText: string;
        let rejectedText: string;

        if (rating.choice === 'A') {
          chosenText   = invert ? responseB.text : responseA.text;
          rejectedText = invert ? responseA.text : responseB.text;
        } else if (rating.choice === 'B') {
          chosenText   = invert ? responseA.text : responseB.text;
          rejectedText = invert ? responseB.text : responseA.text;
        } else {
          // tie — include with margin 0.0; chosen/rejected assignment is arbitrary
          chosenText   = responseA.text;
          rejectedText = responseB.text;
        }

        const line: TrlLine = {
          prompt: prompt.text,
          chosen: chosenText,
          rejected: rejectedText,
          margin,
          dimension: dimension.label,
          annotator_id: annotation.annotatorId,
          task_id: task.id,
          task_name: task.name,
          rating_scale: task.ratingScale,
          metadata: {
            prompt_id: prompt.id,
            annotated_at: annotation.createdAt,
            task_type: task.taskType,
            red_team_inverted: invert,
          },
        };
        lines.push(JSON.stringify(line));
      }

      if (options.limit && lines.length >= options.limit) return lines;
    }
  }

  return lines;
}

// ── Stat helpers for the export dialog ──────────────────────────────────

export interface ExportStats {
  totalAnnotations: number;
  totalDimensions: number;
  trlLines: number;
  rawLines: number;
  excludedCount: number;
}

export function computeExportStats(task: Task, annotations: Annotation[]): ExportStats {
  const trlLines = generateExportLines(task, annotations, { style: 'trl' }).length;
  const rawLines = generateExportLines(task, annotations, { style: 'raw' }).length;
  const excludedCount = annotations.reduce((sum, a) =>
    sum + a.ratings.filter((r) => r.choice === 'skip' || r.choice === 'both_bad').length, 0
  );
  return {
    totalAnnotations: annotations.length,
    totalDimensions: task.dimensions.length,
    trlLines,
    rawLines,
    excludedCount,
  };
}
