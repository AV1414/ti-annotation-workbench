'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Annotation, Task } from '@/lib/types';
import { AnnotationsTab } from './AnnotationsTab';
import { DimensionBreakdown } from './DimensionBreakdown';
import { AgreementTab } from './AgreementTab';

interface TaskDetailTabsProps {
  task: Task;
  annotations: Annotation[];
}

export function TaskDetailTabs({ task, annotations }: TaskDetailTabsProps) {
  // Show IAA tab only if at least one prompt has 2+ annotations from different annotators
  const promptAnnotatorMap = new Map<string, Set<string>>();
  for (const a of annotations) {
    const set = promptAnnotatorMap.get(a.promptId) ?? new Set();
    set.add(a.annotatorId);
    promptAnnotatorMap.set(a.promptId, set);
  }
  const showIAA = [...promptAnnotatorMap.values()].some((s) => s.size >= 2);

  return (
    <Tabs defaultValue="annotations">
      <TabsList>
        <TabsTrigger value="annotations">
          Annotations
          {annotations.length > 0 && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
              {annotations.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="breakdown">Per-Dimension Breakdown</TabsTrigger>
        {showIAA && <TabsTrigger value="agreement">Inter-Annotator Agreement</TabsTrigger>}
      </TabsList>

      <TabsContent value="annotations" className="mt-5">
        <AnnotationsTab
          annotations={annotations}
          dimensions={task.dimensions}
          prompts={task.prompts}
          ratingScale={task.ratingScale}
        />
      </TabsContent>

      <TabsContent value="breakdown" className="mt-5">
        <DimensionBreakdown task={task} annotations={annotations} />
      </TabsContent>

      {showIAA && (
        <TabsContent value="agreement" className="mt-5">
          <AgreementTab
            annotations={annotations}
            dimensions={task.dimensions}
            prompts={task.prompts}
            ratingScale={task.ratingScale}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
