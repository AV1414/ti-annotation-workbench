import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PromptCardProps {
  text: string;
  className?: string;
}

// Naively detect multi-turn format: lines starting with "User:" or "Assistant:"
function parseTurns(text: string) {
  const turnRegex = /^(User|Assistant):\s*/m;
  if (!turnRegex.test(text)) return null;
  return text
    .split(/\n(?=(?:User|Assistant):)/)
    .map((chunk) => {
      const match = chunk.match(/^(User|Assistant):\s*([\s\S]*)/);
      if (!match) return null;
      return { role: match[1] as 'User' | 'Assistant', content: match[2].trim() };
    })
    .filter(Boolean) as { role: 'User' | 'Assistant'; content: string }[];
}

export function PromptCard({ text, className }: PromptCardProps) {
  const turns = parseTurns(text);

  return (
    <Card className={cn('border-border/60', className)}>
      <CardHeader className="pb-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Prompt</p>
      </CardHeader>
      <CardContent className="pt-2">
        {turns ? (
          <div className="space-y-3">
            {turns.map((turn, i) => (
              <div key={i} className="flex gap-3">
                <span className={cn(
                  'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                  turn.role === 'User'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
                )}>
                  {turn.role}
                </span>
                <p className="font-mono text-sm leading-relaxed">{turn.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        )}
      </CardContent>
    </Card>
  );
}
