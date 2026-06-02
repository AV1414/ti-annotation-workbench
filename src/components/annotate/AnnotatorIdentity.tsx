'use client';

import { useEffect, useRef, useState } from 'react';
import { User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AnnotatorIdentity() {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let id = localStorage.getItem('annotatorId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('annotatorId', id);
    }
    const stored = localStorage.getItem('annotatorName') ?? 'Anonymous Annotator';
    setName(stored);
    setDraft(stored);
  }, []);

  const save = () => {
    const trimmed = draft.trim() || 'Anonymous Annotator';
    localStorage.setItem('annotatorName', trimmed);
    setName(trimmed);
    setDraft(trimmed);
    setEditing(false);
  };

  const startEdit = () => {
    setEditing(true);
    setDraft(name);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  return (
    <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-card text-sm w-fit">
      <User className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground whitespace-nowrap text-xs">Annotating as</span>
      {editing ? (
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="flex items-center gap-1.5">
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-6 text-xs border-0 shadow-none px-1 w-32 focus-visible:ring-0"
            autoFocus
          />
          <Button type="submit" size="xs">Save</Button>
          <Button type="button" variant="ghost" size="xs" onClick={() => setEditing(false)}>✕</Button>
        </form>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="text-xs font-medium text-foreground hover:text-primary transition-colors"
        >
          {name || '…'}
        </button>
      )}
    </div>
  );
}
