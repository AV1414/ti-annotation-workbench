import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Configure annotation tasks for ML researchers.
      </p>
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Task Configuration</CardTitle>
            <CardDescription>Placeholder</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This panel will let researchers define annotation jobs: specify
              the model pair to compare, the prompt dataset, labeling
              instructions, and assignment rules for annotators.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
