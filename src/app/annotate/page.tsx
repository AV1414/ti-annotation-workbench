import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AnnotatePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Annotate</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Rate pairs of LLM responses to collect RLHF preference data.
      </p>
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Preference Rating</CardTitle>
            <CardDescription>Placeholder</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This panel will show a prompt with two side-by-side model
              responses, allowing the annotator to select the preferred
              response, add optional comments, and submit to advance to the
              next pair.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
