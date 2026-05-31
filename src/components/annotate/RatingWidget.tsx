'use client';

import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import type { Dimension, RatingScale, TaskType } from '@/lib/types';

// ── Value type ────────────────────────────────────────────────────────────

export type RatingValue = {
  choice: 'A' | 'B' | 'tie' | 'both_bad' | 'skip';
  strength?: 'significantly' | 'better' | 'slightly' | 'negligibly' | null;
} | null;

// ── Shared sub-widget props ───────────────────────────────────────────────

interface SubWidgetProps {
  value: RatingValue;
  onChange: (v: RatingValue) => void;
  taskType: TaskType;
  customScale?: string[];
}

// ── Utility ───────────────────────────────────────────────────────────────

function PillButton({
  active,
  onClick,
  children,
  className,
  variant = 'primary',
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'ghost';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : variant === 'ghost'
          ? 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
          : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5',
        className,
      )}
    >
      {children}
    </button>
  );
}

// ── Binary rater ──────────────────────────────────────────────────────────

function BinaryRater({ value, onChange, taskType }: SubWidgetProps) {
  const aLabel = taskType === 'red_teaming' ? 'Response A (more harmful)' : 'Response A';
  const bLabel = taskType === 'red_teaming' ? 'Response B (more harmful)' : 'Response B';

  const pick = (choice: NonNullable<RatingValue>['choice']) => {
    onChange(value?.choice === choice ? null : { choice, strength: null });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <PillButton active={value?.choice === 'A'} onClick={() => pick('A')} className="flex-1 sm:flex-none">
          {aLabel}
        </PillButton>
        <PillButton active={value?.choice === 'B'} onClick={() => pick('B')} className="flex-1 sm:flex-none">
          {bLabel}
        </PillButton>
      </div>
      <div className="flex flex-wrap gap-2">
        <PillButton active={value?.choice === 'tie'} onClick={() => pick('tie')} variant="ghost">Tie</PillButton>
        <PillButton active={value?.choice === 'both_bad'} onClick={() => pick('both_bad')} variant="ghost">Both Bad</PillButton>
        <PillButton active={value?.choice === 'skip'} onClick={() => pick('skip')} variant="ghost">Skip</PillButton>
      </div>
    </div>
  );
}

// ── Four-point segmented control ─────────────────────────────────────────

export const FOUR_POINT_POSITIONS = [
  { choice: 'A', strength: 'significantly', label: 'A\nsignificantly' },
  { choice: 'A', strength: 'better',        label: 'A\nbetter' },
  { choice: 'A', strength: 'slightly',      label: 'A\nslightly' },
  { choice: 'tie', strength: 'negligibly',  label: 'Tie /\nnegligibly' },
  { choice: 'B', strength: 'slightly',      label: 'B\nslightly' },
  { choice: 'B', strength: 'better',        label: 'B\nbetter' },
  { choice: 'B', strength: 'significantly', label: 'B\nsignificantly' },
] as const;

export type FourPointPos = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function valueToFourPointPos(v: RatingValue): FourPointPos | null {
  if (!v || v.choice === 'both_bad' || v.choice === 'skip') return null;
  return FOUR_POINT_POSITIONS.findIndex(
    (p) => p.choice === v.choice && p.strength === v.strength,
  ) as FourPointPos;
}

export function fourPointPosToValue(pos: FourPointPos): RatingValue {
  const p = FOUR_POINT_POSITIONS[pos];
  return { choice: p.choice, strength: p.strength };
}

function SegmentedControl({
  positions,
  activeIndex,
  onSelect,
  className,
}: {
  positions: readonly { label: string }[];
  activeIndex: number | null;
  onSelect: (i: number) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex overflow-x-auto rounded-lg border bg-muted/30', className)}>
      {positions.map((pos, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            'flex-1 min-w-[60px] border-r last:border-r-0 px-2 py-2 text-center text-[11px] leading-tight font-medium transition-colors whitespace-pre-line',
            activeIndex === i
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {pos.label}
        </button>
      ))}
    </div>
  );
}

function FourPointRater({ value, onChange }: SubWidgetProps) {
  const activeIndex = valueToFourPointPos(value);

  const handleSegment = (i: number) => {
    const next = fourPointPosToValue(i as FourPointPos);
    onChange(activeIndex === i ? null : next);
  };

  const pick = (choice: 'both_bad' | 'skip') => {
    onChange(value?.choice === choice ? null : { choice, strength: null });
  };

  return (
    <div className="space-y-3">
      <SegmentedControl
        positions={FOUR_POINT_POSITIONS}
        activeIndex={activeIndex}
        onSelect={handleSegment}
      />
      <p className="text-[10px] text-muted-foreground">
        Strength of preference is exported as a margin term for reward model training (Touvron et al. 2023, §3.2.2, Eq. 2).
      </p>
      <div className="flex gap-2">
        <PillButton active={value?.choice === 'both_bad'} onClick={() => pick('both_bad')} variant="ghost">Both Bad</PillButton>
        <PillButton active={value?.choice === 'skip'} onClick={() => pick('skip')} variant="ghost">Skip</PillButton>
      </div>
    </div>
  );
}

// ── Likert 7 ─────────────────────────────────────────────────────────────

const LIKERT_7_PREFERENCE = [
  { label: 'A strongly' },
  { label: 'A better' },
  { label: 'A slightly' },
  { label: 'Tie' },
  { label: 'B slightly' },
  { label: 'B better' },
  { label: 'B strongly' },
] as const;

const LIKERT_7_RATING = [
  { label: '1\nWorst' },
  { label: '2' },
  { label: '3' },
  { label: '4\nNeutral' },
  { label: '5' },
  { label: '6' },
  { label: '7\nBest' },
] as const;

// Map Likert 7 preference positions to RatingValue (same schema as 4-point)
const LIKERT_PREF_TO_VALUE: RatingValue[] = [
  { choice: 'A', strength: 'significantly' },
  { choice: 'A', strength: 'better' },
  { choice: 'A', strength: 'slightly' },
  { choice: 'tie', strength: 'negligibly' },
  { choice: 'B', strength: 'slightly' },
  { choice: 'B', strength: 'better' },
  { choice: 'B', strength: 'significantly' },
];

// For rating tasks: map score 1-7 to choice=A, strength encodes level
const LIKERT_RATING_TO_VALUE: RatingValue[] = [
  { choice: 'both_bad', strength: null },      // 1 = worst
  { choice: 'skip', strength: null },           // 2
  { choice: 'tie', strength: 'negligibly' },    // 3
  { choice: 'tie', strength: null },            // 4 = neutral
  { choice: 'A', strength: 'slightly' },        // 5
  { choice: 'A', strength: 'better' },          // 6
  { choice: 'A', strength: 'significantly' },   // 7 = best
];

function Likert7Rater({ value, onChange, taskType }: SubWidgetProps) {
  const isRating = taskType === 'rating';
  const positions = isRating ? LIKERT_7_RATING : LIKERT_7_PREFERENCE;
  const valueMap = isRating ? LIKERT_RATING_TO_VALUE : LIKERT_PREF_TO_VALUE;

  const activeIndex = valueMap.findIndex(
    (v) => v && value && v.choice === value.choice && v.strength === value.strength,
  );

  const handleSegment = (i: number) => {
    onChange(activeIndex === i ? null : valueMap[i]);
  };

  return (
    <SegmentedControl
      positions={positions}
      activeIndex={activeIndex === -1 ? null : activeIndex}
      onSelect={handleSegment}
    />
  );
}

// ── Custom scale ──────────────────────────────────────────────────────────

// Maps up to N custom labels to reasonable RatingValues
function labelIndexToValue(i: number, total: number): RatingValue {
  if (total === 1) return { choice: 'A', strength: null };
  if (total === 2) return i === 0 ? { choice: 'A', strength: null } : { choice: 'B', strength: null };
  // For 3+: spread across A-strongly → tie → B-strongly
  const pos = Math.round((i / (total - 1)) * 6) as FourPointPos;
  return fourPointPosToValue(pos);
}

function CustomScaleRater({ value, onChange, customScale }: SubWidgetProps) {
  const labels = customScale ?? [];
  if (!labels.length) return <p className="text-sm text-muted-foreground">No scale labels configured.</p>;

  const positions = labels.map((l) => ({ label: l }));
  const valueMap = labels.map((_, i) => labelIndexToValue(i, labels.length));

  const activeIndex = valueMap.findIndex(
    (v) => v && value && v.choice === value.choice && v.strength === value.strength,
  );

  const handleSegment = (i: number) => {
    onChange(activeIndex === i ? null : valueMap[i]);
  };

  return (
    <SegmentedControl
      positions={positions}
      activeIndex={activeIndex === -1 ? null : activeIndex}
      onSelect={handleSegment}
    />
  );
}

// ── Widget map — the config-driven dispatch ───────────────────────────────

const WIDGET_MAP: Record<RatingScale, ComponentType<SubWidgetProps>> = {
  binary:     BinaryRater,
  four_point: FourPointRater,
  likert_7:   Likert7Rater,
  custom:     CustomScaleRater,
};

// ── Public RatingWidget ───────────────────────────────────────────────────

interface RatingWidgetProps {
  dimension: Dimension;
  taskType: TaskType;
  ratingScale: RatingScale;
  customScale?: string[];
  value: RatingValue;
  onChange: (v: RatingValue) => void;
}

export function RatingWidget({ dimension, taskType, ratingScale, customScale, value, onChange }: RatingWidgetProps) {
  const SubWidget = WIDGET_MAP[ratingScale];

  return (
    <div className="space-y-3">
      <div>
        <p className="text-base font-semibold">{dimension.label}</p>
        {dimension.description && (
          <p className="text-sm text-muted-foreground">{dimension.description}</p>
        )}
      </div>
      <SubWidget
        value={value}
        onChange={onChange}
        taskType={taskType}
        customScale={customScale}
      />
    </div>
  );
}
