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

function GhostPill({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-muted-foreground/40 bg-muted text-foreground'
          : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  );
}

// ── Binary rater — sky-colored large pills ────────────────────────────────

function BinaryRater({ value, onChange, taskType }: SubWidgetProps) {
  const aLabel = taskType === 'red_teaming' ? 'Response A (more harmful)' : 'Response A';
  const bLabel = taskType === 'red_teaming' ? 'Response B (more harmful)' : 'Response B';

  const pick = (choice: NonNullable<RatingValue>['choice']) => {
    onChange(value?.choice === choice ? null : { choice, strength: null });
  };

  return (
    <div className="space-y-3">
      {/* Main A/B choices — large, sky-tinted pills */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => pick('A')}
          className={cn(
            'flex-1 sm:flex-none inline-flex items-center justify-center rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value?.choice === 'A'
              ? 'border-brand-info bg-brand-info text-white shadow-sm'
              : 'border-brand-info/40 bg-brand-info-subtle text-sky-700 hover:border-brand-info hover:bg-brand-info/10',
          )}
        >
          {aLabel}
        </button>
        <button
          type="button"
          onClick={() => pick('B')}
          className={cn(
            'flex-1 sm:flex-none inline-flex items-center justify-center rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value?.choice === 'B'
              ? 'border-brand-info bg-brand-info text-white shadow-sm'
              : 'border-brand-info/40 bg-brand-info-subtle text-sky-700 hover:border-brand-info hover:bg-brand-info/10',
          )}
        >
          {bLabel}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <GhostPill active={value?.choice === 'tie'} onClick={() => pick('tie')}>Tie</GhostPill>
        <GhostPill active={value?.choice === 'both_bad'} onClick={() => pick('both_bad')}>Both Bad</GhostPill>
        <GhostPill active={value?.choice === 'skip'} onClick={() => pick('skip')}>Skip</GhostPill>
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

// Color for each position: indigo for A-side, neutral for tie, violet for B-side
const SEGMENT_COLORS = [
  // A-side (0-2): indigo, darkest → lightest
  { inactive: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100', active: 'bg-indigo-600 text-white' },
  { inactive: 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100', active: 'bg-indigo-500 text-white' },
  { inactive: 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100', active: 'bg-indigo-400 text-white' },
  // Tie (3): neutral gray
  { inactive: 'bg-muted text-muted-foreground hover:bg-muted/80', active: 'bg-muted-foreground/20 text-foreground' },
  // B-side (4-6): violet, lightest → darkest
  { inactive: 'bg-violet-50 text-violet-400 hover:bg-violet-100', active: 'bg-violet-400 text-white' },
  { inactive: 'bg-violet-50 text-violet-500 hover:bg-violet-100', active: 'bg-violet-500 text-white' },
  { inactive: 'bg-violet-50 text-violet-600 hover:bg-violet-100', active: 'bg-violet-600 text-white' },
];

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
      <div className="flex overflow-x-auto rounded-lg border bg-background">
        {FOUR_POINT_POSITIONS.map((pos, i) => {
          const colors = SEGMENT_COLORS[i];
          const isActive = activeIndex === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSegment(i)}
              className={cn(
                'flex-1 min-w-[56px] border-r last:border-r-0 px-2 py-2.5 text-center text-[11px] leading-tight font-medium transition-colors whitespace-pre-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
                isActive ? colors.active : colors.inactive,
              )}
            >
              {pos.label}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Strength of preference is exported as a margin term for reward model training (Touvron et al. 2023, §3.2.2, Eq. 2).
      </p>
      <div className="flex gap-2">
        <GhostPill active={value?.choice === 'both_bad'} onClick={() => pick('both_bad')}>Both Bad</GhostPill>
        <GhostPill active={value?.choice === 'skip'} onClick={() => pick('skip')}>Skip</GhostPill>
      </div>
    </div>
  );
}

// ── Likert 7 ─────────────────────────────────────────────────────────────

// Numeric labels for preference Likert — 1 = strongly prefer A, 7 = strongly prefer B
const LIKERT_7_NUMERIC = ['1', '2', '3', '4', '5', '6', '7'] as const;

const LIKERT_7_RATING = [
  { label: '1\nWorst' },
  { label: '2' },
  { label: '3' },
  { label: '4\nNeutral' },
  { label: '5' },
  { label: '6' },
  { label: '7\nBest' },
] as const;

const LIKERT_PREF_TO_VALUE: RatingValue[] = [
  { choice: 'A', strength: 'significantly' },
  { choice: 'A', strength: 'better' },
  { choice: 'A', strength: 'slightly' },
  { choice: 'tie', strength: 'negligibly' },
  { choice: 'B', strength: 'slightly' },
  { choice: 'B', strength: 'better' },
  { choice: 'B', strength: 'significantly' },
];

const LIKERT_RATING_TO_VALUE: RatingValue[] = [
  { choice: 'both_bad', strength: null },
  { choice: 'skip', strength: null },
  { choice: 'tie', strength: 'negligibly' },
  { choice: 'tie', strength: null },
  { choice: 'A', strength: 'slightly' },
  { choice: 'A', strength: 'better' },
  { choice: 'A', strength: 'significantly' },
];

function Likert7Rater({ value, onChange, taskType }: SubWidgetProps) {
  const isRating = taskType === 'rating';
  const valueMap = isRating ? LIKERT_RATING_TO_VALUE : LIKERT_PREF_TO_VALUE;

  const activeIndex = valueMap.findIndex(
    (v) => v && value && v.choice === value.choice && v.strength === value.strength,
  );

  const handleSegment = (i: number) => {
    onChange(activeIndex === i ? null : valueMap[i]);
  };

  if (isRating) {
    return (
      <div className="flex overflow-x-auto rounded-lg border bg-background">
        {LIKERT_7_RATING.map((pos, i) => {
          const colors = SEGMENT_COLORS[i] ?? SEGMENT_COLORS[3];
          const isActive = activeIndex === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSegment(i)}
              className={cn(
                'flex-1 min-w-[60px] border-r last:border-r-0 px-2 py-2.5 text-center text-[11px] leading-tight font-medium transition-colors whitespace-pre-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
                isActive ? colors.active : colors.inactive,
              )}
            >
              {pos.label}
            </button>
          );
        })}
      </div>
    );
  }

  // Preference Likert: numeric 1–7, uniform primary fill
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Rate from <span className="font-medium">1</span> (strongly prefer A) to{' '}
        <span className="font-medium">7</span> (strongly prefer B). 4 = tie.
      </p>
      <div className="flex overflow-x-auto rounded-lg border bg-background">
        {LIKERT_7_NUMERIC.map((label, i) => {
          const isActive = activeIndex === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSegment(i)}
              className={cn(
                'flex-1 min-w-[40px] border-r last:border-r-0 px-2 py-2.5 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Custom scale ──────────────────────────────────────────────────────────

function labelIndexToValue(i: number, total: number): RatingValue {
  if (total === 1) return { choice: 'A', strength: null };
  if (total === 2) return i === 0 ? { choice: 'A', strength: null } : { choice: 'B', strength: null };
  const pos = Math.round((i / (total - 1)) * 6) as FourPointPos;
  return fourPointPosToValue(pos);
}

function CustomScaleRater({ value, onChange, customScale }: SubWidgetProps) {
  const labels = customScale ?? [];
  if (!labels.length) return <p className="text-sm text-muted-foreground">No scale labels configured.</p>;

  const valueMap = labels.map((_, i) => labelIndexToValue(i, labels.length));
  const activeIndex = valueMap.findIndex(
    (v) => v && value && v.choice === value.choice && v.strength === value.strength,
  );

  return (
    <div className="flex overflow-x-auto rounded-lg border bg-muted/30">
      {labels.map((label, i) => {
        const isActive = activeIndex === i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(activeIndex === i ? null : valueMap[i])}
            className={cn(
              'flex-1 min-w-[60px] border-r last:border-r-0 px-2 py-2 text-center text-[11px] leading-tight font-medium transition-colors whitespace-pre-line',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Widget map ────────────────────────────────────────────────────────────

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
