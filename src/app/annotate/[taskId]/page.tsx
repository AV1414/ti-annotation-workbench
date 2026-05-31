import { notFound } from 'next/navigation';
import { getTask, listAnnotationsByTask } from '@/lib/repository';
import { AnnotationForm } from '@/components/annotate/AnnotationForm';

interface AnnotateTaskPageProps {
  params: Promise<{ taskId: string }>;
}

export default async function AnnotateTaskPage({ params }: AnnotateTaskPageProps) {
  const { taskId } = await params;

  const [task, allAnnotations] = await Promise.all([
    getTask(taskId),
    listAnnotationsByTask(taskId),
  ]);

  if (!task) notFound();

  return <AnnotationForm task={task} allAnnotations={allAnnotations} />;
}
