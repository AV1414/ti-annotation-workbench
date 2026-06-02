export type TaskType = 'preference' | 'red_teaming' | 'rating';

export type RatingScale = 'binary' | 'four_point' | 'likert_7' | 'custom';

export interface ResponseSource {
  id: string;
  text: string;
  model?: string;
  temperature?: number;
}

export interface Prompt {
  id: string;
  text: string;
  responses: ResponseSource[];
}

export interface Dimension {
  id: string;
  label: string;
  description?: string;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  taskType: TaskType;
  ratingScale: RatingScale;
  customScale?: string[];
  dimensions: Dimension[];
  redTeamInvertSignal?: boolean;
  prompts: Prompt[];
  status: 'draft' | 'active' | 'completed';
}

export interface RatingChoice {
  dimensionId: string;
  choice: 'A' | 'B' | 'tie' | 'both_bad' | 'skip';
  strength?: 'significantly' | 'better' | 'slightly' | 'negligibly' | null;
}

export interface Annotation {
  id: string;
  taskId: string;
  promptId: string;
  annotatorId: string;
  ratings: RatingChoice[];
  comment?: string;
  createdAt: string;
}

export interface Annotator {
  id: string;
  name: string;
}

export interface TaskProgress {
  totalPrompts: number;
  /** Prompts that have ≥1 annotation from any annotator — the coverage metric. */
  uniquePromptsAnnotated: number;
  /** Capped at 100. Use this for progress bars. */
  completionPct: number;
  /** Raw annotation count across all annotators — the depth metric. */
  totalAnnotations: number;
  uniqueAnnotators: number;
}
