import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Overview of annotation tasks and completion statistics.
      </p>
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Task Overview</CardTitle>
            <CardDescription>Placeholder</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This panel will display active annotation tasks, per-task
              completion rates, annotator throughput, and agreement metrics
              across all RLHF jobs.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
