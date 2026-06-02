import { cn } from '@/lib/utils';

interface PromptCardProps {
  text: string;
  className?: string;
}

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
    <div className={cn(
      'rounded-lg border border-border bg-card shadow-sm border-l-4 border-l-primary',
      className,
    )}>
      <div className="px-5 pt-4 pb-1">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Prompt</p>
      </div>
      <div className="px-5 pb-4">
        {turns ? (
          <div className="space-y-3">
            {turns.map((turn, i) => (
              <div key={i} className="flex gap-3">
                <span className={cn(
                  'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                  turn.role === 'User'
                    ? 'bg-[hsl(var(--info-bg))] text-[hsl(var(--info))]'
                    : 'bg-[hsl(var(--purple-bg))] text-[hsl(var(--purple))]',
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
      </div>
    </div>
  );
}
