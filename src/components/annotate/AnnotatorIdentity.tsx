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
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <User className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-sm text-muted-foreground whitespace-nowrap">You&apos;re annotating as:</span>
      {editing ? (
        <form
          onSubmit={(e) => { e.preventDefault(); save(); }}
          className="flex items-center gap-2 flex-1"
        >
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-7 text-sm"
            autoFocus
          />
          <Button type="submit" size="sm" className="h-7">Set</Button>
          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </form>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="flex-1 text-left text-sm font-medium hover:text-primary transition-colors"
        >
          {name || '…'}
        </button>
      )}
    </div>
  );
}
