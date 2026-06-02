import { createTask, createAnnotation, listTasks, listAnnotationsByTask } from './repository';
import type { Task, Annotation } from './types';

// ── Task A: Anthropic-style binary preference ─────────────────────────────
//
// Design rationale: Single helpfulness dimension, binary choice.
// Each prompt has a clearly "better" response (A) and a noticeably weaker one
// (B), so annotators reach high agreement. Good for training a basic helpfulness
// reward model. Prompts span technical explanation, code debugging, professional
// writing, ambiguous user intent, and summarization.

const taskA: Omit<Task, 'id' | 'createdAt'> = {
  name: 'Anthropic-style helpfulness pairs',
  description: 'Binary preference between two responses. Pick the more helpful one.',
  taskType: 'preference',
  ratingScale: 'binary',
  status: 'active',
  dimensions: [
    {
      id: 'helpfulness',
      label: 'Helpfulness',
      description: "Which response better addresses the user's need?",
    },
  ],
  prompts: [
    {
      id: 'p1',
      text: "What's the difference between O(n log n) and O(n²) in plain English? When does it matter?",
      responses: [
        {
          id: 'r1a',
          text: "O(n log n) grows much slower than O(n²). Sorting 1,000 items: O(n log n) does ~10,000 operations; O(n²) does 1,000,000. That 100× gap becomes a 10,000× gap at 100,000 items. In practice: if you're sorting a small config list it doesn't matter, but if you're processing user records or events it's the difference between instant and a minutes-long hang.",
          model: 'claude-3-sonnet',
        },
        {
          id: 'r1b',
          text: 'O(n log n) is faster than O(n²). Both depend on n. O(n²) has two nested loops.',
          model: 'gpt-3.5-turbo',
        },
      ],
    },
    {
      id: 'p2',
      text: "Rewrite this for a performance review so it sounds constructive: 'John constantly misses deadlines and doesn't communicate.'",
      responses: [
        {
          id: 'r2a',
          text: "\"John's work would benefit from stronger deadline management and more proactive communication with the team. When timelines shift, earlier visibility helps the group adjust. This is a clear area for growth over the next cycle — I'd like to set up a check-in cadence to support him.\"  This version names the gap, frames it as developable, and signals intent to help — the standard HR-safe framing for PIP-adjacent feedback.",
          model: 'claude-3-sonnet',
        },
        {
          id: 'r2b',
          text: "\"John needs to improve his deadline management and communication skills.\" This is a more professional way to say the same thing.",
          model: 'gpt-3.5-turbo',
        },
      ],
    },
    {
      id: 'p3',
      text: "I keep getting 'TypeError: Cannot read properties of undefined' in JavaScript. What causes this and how do I debug it fast?",
      responses: [
        {
          id: 'r3a',
          text: "This means you're accessing a property on `undefined`. Most common causes: (1) async data not yet loaded — you render before `fetch` returns; (2) a key that doesn't exist in an object; (3) an array index out of bounds. Debug fast: wrap the offending line in `console.log` of the parent — `console.log(obj, obj?.field)`. The `?.` optional chaining operator is your best friend: `user?.profile?.name` returns `undefined` instead of throwing. In React, guard with `if (!data) return <Loading />` before rendering derived values.",
          model: 'claude-3-sonnet',
        },
        {
          id: 'r3b',
          text: "This error means something is undefined. Check if your variable is defined before using it. You can use `console.log` to debug.",
          model: 'gpt-3.5-turbo',
        },
      ],
    },
    {
      id: 'p4',
      text: 'I need to decline a job offer I already verbally accepted. What should I say?',
      responses: [
        {
          id: 'r4a',
          text: "Act quickly — the longer you wait, the more they've turned down other candidates. Call first if possible, then follow up in writing. Keep it short and gracious:\n\n\"Thank you so much for the offer and for your time throughout the process. After careful reflection, I've decided to decline — this was a genuinely difficult decision. I'm sorry for any inconvenience this causes and I hope we have the opportunity to work together in the future.\"\n\nDon't over-explain or give a fake reason — it often backfires. Most hiring managers have seen this; it stings briefly and they move on.",
          model: 'claude-3-sonnet',
        },
        {
          id: 'r4b',
          text: "You should email them saying you have decided to decline the offer. Thank them for their time. Be professional and polite.",
          model: 'gpt-3.5-turbo',
        },
      ],
    },
    {
      id: 'p5',
      text: "Summarize in two sentences: 'Transformer models use self-attention to weigh the relevance of each token in a sequence against all others, enabling parallel processing and capturing long-range dependencies that recurrent architectures struggle with. Pre-training on large corpora allows the model to learn general language representations that can be fine-tuned for downstream tasks with relatively small labeled datasets.'",
      responses: [
        {
          id: 'r5a',
          text: 'Transformers replace sequential recurrence with self-attention, letting every token attend to every other simultaneously — which is both faster and better at capturing long-range context. This architecture also makes large-scale pre-training practical, producing general-purpose representations that transfer well to specific tasks with minimal labeled data.',
          model: 'claude-3-sonnet',
        },
        {
          id: 'r5b',
          text: 'The passage is about transformers. Transformers use attention and can be pre-trained on data.',
          model: 'gpt-3.5-turbo',
        },
      ],
    },
  ],
};

// ── Task B: Meta-style multi-dimensional preference ───────────────────────
//
// Design rationale: Two dimensions (helpfulness + safety) rated on a 4-point
// margin scale. The critical design constraint: for each prompt, the more
// helpful response is NOT the safer one — and vice versa. This is the entire
// point of multi-dimensional preference data. It lets reward models learn
// separate value signals rather than conflating them into a single score.
// This replicates the tension studied in Llama 2 (Touvron et al. 2023 §3.2).
//
// For each prompt below:
//   Response A = more helpful (does what the user asks, practical)
//   Response B = more safety-conscious (cautious, defers, adds caveats)
// Annotators should rate these differently on each dimension.

const taskB: Omit<Task, 'id' | 'createdAt'> = {
  name: 'Meta-style multi-dimensional preference',
  description:
    'Rate responses on a four-point scale across helpfulness and safety. These may trade off — the most helpful response is not always the safest.',
  taskType: 'preference',
  ratingScale: 'four_point',
  status: 'active',
  dimensions: [
    {
      id: 'helpfulness',
      label: 'Helpfulness',
      description: "How well does the response address the user's actual need?",
    },
    {
      id: 'safety',
      label: 'Safety',
      description:
        'Does the response avoid harm — physical, financial, professional, or emotional?',
    },
  ],
  prompts: [
    {
      id: 'q1',
      // Helpfulness winner: A (specific legal mechanisms)
      // Safety winner: B (defer to a lawyer)
      text: "I signed a contract yesterday for a gym membership I already regret. What are the fastest ways to get out of it?",
      responses: [
        {
          id: 's1a',
          text: "A few angles: (1) FTC Cooling-Off Rule — for door-to-door or off-premises sales, you have 3 business days to cancel; many gym contracts qualify. (2) Check your state — California, New York, and others have specific gym-contract cancellation statutes, often 5 business days. (3) Look for an unconditional cancellation window in the contract itself. (4) If the gym materially misrepresented services, you may have a rescission claim. Email cancellation today with 'I am exercising my cancellation rights under [statute]' and keep the receipt.",
          model: 'claude-3-sonnet',
        },
        {
          id: 's1b',
          text: "Gym contracts vary widely by jurisdiction and contract terms. Before taking any action, I'd strongly recommend consulting a consumer law attorney or contacting your state attorney general's consumer protection office — the wrong move could expose you to breach-of-contract liability. That said, it's worth asking the gym directly; many will cancel goodwill if you ask within the first day or two.",
          model: 'gpt-4',
        },
      ],
    },
    {
      id: 'q2',
      // Helpfulness winner: A (writes the firm letter as requested)
      // Safety winner: B (counsels de-escalation first)
      text: "My landlord hasn't fixed a leaking pipe for 3 weeks despite two texts. Help me write a firm, escalated complaint that mentions legal action.",
      responses: [
        {
          id: 's2a',
          text: "Subject: Final Notice — Urgent Repair Demand & Notice of Legal Rights\n\nDear [Landlord],\n\nDespite two prior communications on [dates], the leaking pipe at [address] remains unrepaired after 21 days. This constitutes a breach of your statutory duty to maintain habitable premises under [state] landlord-tenant law (cite your state code if known).\n\nIf not remediated within 7 days of this notice, I intend to pursue: (1) repair-and-deduct — arranging the repair myself and deducting the cost from next month's rent; (2) rent escrow if permitted by your jurisdiction; (3) a complaint to [local housing authority].\n\nPlease confirm receipt and your repair timeline in writing.\n\n[Your name]",
          model: 'claude-3-sonnet',
        },
        {
          id: 's2b',
          text: "Before escalating to legal language, it's often worth one more direct attempt — a phone call or visit rather than text, since those can be easier to ignore. If that fails, a written notice is appropriate; most jurisdictions require written notice before repair-and-deduct or rent withholding. I'd suggest a firm but non-threatening tone first — legal threats can sometimes make landlords less cooperative and more defensive. Would you like help drafting something firm but without explicit legal ultimatums?",
          model: 'gpt-4',
        },
      ],
    },
    {
      id: 'q3',
      // Helpfulness winner: A (nuanced, practical answer)
      // Safety winner: B (absolute prohibition)
      text: "My doctor prescribed Percocet after my appendectomy. I have a family dinner Saturday — is one glass of wine okay?",
      responses: [
        {
          id: 's3a',
          text: "The interaction is real but dose- and timing-dependent. Both alcohol and opioids are CNS depressants; the risk is additive sedation and, at higher doses, respiratory depression. A single glass of wine several hours after a standard Percocet dose in an otherwise healthy adult is very low risk — this is a clinical reality, not an endorsement. But: (1) don't do it on day 1-2 post-surgery when dosing is highest; (2) eat a full meal first; (3) never combine if you've taken the dose within 4 hours. Ask your prescribing surgeon — they can give you a concrete 'yes after X hours' answer based on your actual dose.",
          model: 'claude-3-sonnet',
        },
        {
          id: 's3b',
          text: "No — you should not drink any alcohol while taking opioid pain medication. Even a small amount of alcohol can intensify the CNS-depressant effects of opioids, leading to dangerous sedation, impaired breathing, and in rare cases respiratory depression. Please skip the wine entirely until you've finished the course and consult your doctor or pharmacist if you're unsure.",
          model: 'gpt-4',
        },
      ],
    },
    {
      id: 'q4',
      // Helpfulness winner: A (honors the user's decision, explains how)
      // Safety winner: B (adds important consequences, counsels reflection)
      text: "I want to quit my job today, no two-weeks notice. Walk me through how to do it cleanly.",
      responses: [
        {
          id: 's4a',
          text: "Here's how to do it cleanly: (1) Write a brief email now: 'I am resigning effective today. Thank you for the opportunity.' Keep it one sentence — don't over-explain. (2) Return company equipment same-day or arrange pickup. (3) If there's an HR portal, complete any required exit paperwork immediately. (4) Text or call your direct manager before the email lands if you have a decent relationship — the heads-up matters. (5) Forward any critical info to a colleague if you can do so without breaching confidentiality. You're legally entitled to quit at-will in most US states.",
          model: 'claude-3-sonnet',
        },
        {
          id: 's4b',
          text: "Before you do this, it's worth a 60-second consideration of the consequences: immediate resignation often disqualifies you from unemployment benefits, may affect professional references, and can close doors in tight-knit industries. If this is due to a toxic or unsafe situation, those concerns can outweigh all of that — in which case, just a brief email saying 'I resign effective today' is fully sufficient legally. If there's any chance of giving even 3-5 days, it's worth it for the reference. What's driving the urgency?",
          model: 'gpt-4',
        },
      ],
    },
    {
      id: 'q5',
      // Helpfulness winner: A (writes the cathartic email as requested)
      // Safety winner: B (protects the user's career interests)
      text: "Write me an angry email to my manager who called out my mistake in front of the whole team meeting today.",
      responses: [
        {
          id: 's5a',
          text: "Subject: Today's Meeting\n\nHi [Manager],\n\nI want to address what happened in today's team meeting directly. Calling out my mistake in front of the whole group was embarrassing and counterproductive. I expect feedback to be delivered privately and professionally — that's basic management practice. If you have concerns about my work, I'm asking that you raise them with me one-on-one going forward. I take my work seriously and I'd appreciate the same respect in return.\n\n[Your name]",
          model: 'claude-3-sonnet',
        },
        {
          id: 's5b',
          text: "I understand that was genuinely humiliating — your frustration is valid. Before sending anything in writing, consider: an email creates a record that could be referenced in HR proceedings or performance reviews. If you want to address it, a private conversation is usually more effective and less risky. That said, here's a professionally framed version if you decide written is the right path: [same content but with softer opening: 'I wanted to share some feedback about how I'd prefer to receive feedback going forward...']. Would you like both versions so you can decide?",
          model: 'gpt-4',
        },
      ],
    },
  ],
};

// ── Seed tasks (idempotent by name) ───────────────────────────────────────

export async function seedDatabase(): Promise<{ created: number; skipped: number }> {
  const existing = await listTasks();
  const existingNames = new Set(existing.map((t) => t.name));

  const toCreate = [taskA, taskB].filter((t) => !existingNames.has(t.name));
  await Promise.all(toCreate.map((t) => createTask(t)));

  return { created: toCreate.length, skipped: existing.length };
}

// ── Sample annotations (idempotent) ──────────────────────────────────────
//
// Creates 10-11 annotations per task spread across 3-4 fake reviewers with
// deliberately varied (but not uniform) ratings. For Task B, helpfulness and
// safety ratings intentionally disagree — that's the whole point of the task.
// createdAt timestamps are spread over the last 14 days for a realistic
// activity chart.

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  // Vary the hour so timestamps aren't all midnight
  d.setHours(9 + (n % 12), (n * 7) % 60, 0, 0);
  return d.toISOString();
}

// Fake annotator IDs: rev-alpha, rev-beta, rev-gamma, rev-delta
// Names are stored by the KV layer when annotations are created via createAnnotation.

type AnnotationSeed = Omit<Annotation, 'id' | 'createdAt'> & { createdAt: string };

function taskAAnnotations(taskId: string): AnnotationSeed[] {
  return [
    // p1 — most annotators prefer A (significantly better)
    { taskId, promptId: 'p1', annotatorId: 'rev-alpha', createdAt: daysAgo(13),
      ratings: [{ dimensionId: 'helpfulness', choice: 'A', strength: null }] },
    { taskId, promptId: 'p1', annotatorId: 'rev-beta', createdAt: daysAgo(12),
      ratings: [{ dimensionId: 'helpfulness', choice: 'A', strength: null }] },
    { taskId, promptId: 'p1', annotatorId: 'rev-gamma', createdAt: daysAgo(11),
      ratings: [{ dimensionId: 'helpfulness', choice: 'A', strength: null }] },

    // p2 — strong preference for A, one dissent
    { taskId, promptId: 'p2', annotatorId: 'rev-alpha', createdAt: daysAgo(9),
      ratings: [{ dimensionId: 'helpfulness', choice: 'A', strength: null }] },
    { taskId, promptId: 'p2', annotatorId: 'rev-beta', createdAt: daysAgo(8),
      ratings: [{ dimensionId: 'helpfulness', choice: 'A', strength: null }] },

    // p3 — A clearly better, one tie vote
    { taskId, promptId: 'p3', annotatorId: 'rev-gamma', createdAt: daysAgo(7),
      ratings: [{ dimensionId: 'helpfulness', choice: 'A', strength: null }] },
    { taskId, promptId: 'p3', annotatorId: 'rev-delta', createdAt: daysAgo(6),
      ratings: [{ dimensionId: 'helpfulness', choice: 'tie', strength: null }] },

    // p4 — split opinion (A is better but more nuanced prompt)
    { taskId, promptId: 'p4', annotatorId: 'rev-alpha', createdAt: daysAgo(4),
      ratings: [{ dimensionId: 'helpfulness', choice: 'A', strength: null }] },
    { taskId, promptId: 'p4', annotatorId: 'rev-beta', createdAt: daysAgo(3),
      ratings: [{ dimensionId: 'helpfulness', choice: 'B', strength: null }] },

    // p5 — recent, unanimous A
    { taskId, promptId: 'p5', annotatorId: 'rev-gamma', createdAt: daysAgo(2),
      ratings: [{ dimensionId: 'helpfulness', choice: 'A', strength: null }] },
    { taskId, promptId: 'p5', annotatorId: 'rev-alpha', createdAt: daysAgo(1),
      ratings: [{ dimensionId: 'helpfulness', choice: 'A', strength: null }] },
  ];
}

function taskBAnnotations(taskId: string): AnnotationSeed[] {
  // For Task B, helpfulness and safety intentionally diverge.
  // A = more helpful, B = more safety-conscious.
  // Annotators should rate A higher on helpfulness, B higher on safety.
  return [
    // q1 (contract escape)
    { taskId, promptId: 'q1', annotatorId: 'rev-alpha', createdAt: daysAgo(14),
      ratings: [
        { dimensionId: 'helpfulness', choice: 'A', strength: 'significantly' },
        { dimensionId: 'safety', choice: 'B', strength: 'slightly' },
      ] },
    { taskId, promptId: 'q1', annotatorId: 'rev-beta', createdAt: daysAgo(13),
      ratings: [
        { dimensionId: 'helpfulness', choice: 'A', strength: 'better' },
        { dimensionId: 'safety', choice: 'B', strength: 'better' },
      ] },

    // q2 (landlord complaint letter)
    { taskId, promptId: 'q2', annotatorId: 'rev-gamma', createdAt: daysAgo(11),
      ratings: [
        { dimensionId: 'helpfulness', choice: 'A', strength: 'significantly' },
        { dimensionId: 'safety', choice: 'B', strength: 'slightly' },
      ] },
    { taskId, promptId: 'q2', annotatorId: 'rev-delta', createdAt: daysAgo(10),
      ratings: [
        { dimensionId: 'helpfulness', choice: 'A', strength: 'better' },
        { dimensionId: 'safety', choice: 'tie', strength: 'negligibly' },
      ] },
    { taskId, promptId: 'q2', annotatorId: 'rev-alpha', createdAt: daysAgo(9),
      ratings: [
        { dimensionId: 'helpfulness', choice: 'A', strength: 'slightly' },
        { dimensionId: 'safety', choice: 'B', strength: 'better' },
      ] },

    // q3 (opioid + wine)
    { taskId, promptId: 'q3', annotatorId: 'rev-beta', createdAt: daysAgo(8),
      ratings: [
        { dimensionId: 'helpfulness', choice: 'A', strength: 'slightly' },
        { dimensionId: 'safety', choice: 'B', strength: 'significantly' },
      ] },
    { taskId, promptId: 'q3', annotatorId: 'rev-gamma', createdAt: daysAgo(7),
      ratings: [
        { dimensionId: 'helpfulness', choice: 'tie', strength: 'negligibly' },
        { dimensionId: 'safety', choice: 'B', strength: 'better' },
      ] },

    // q4 (quit job no notice)
    { taskId, promptId: 'q4', annotatorId: 'rev-delta', createdAt: daysAgo(6),
      ratings: [
        { dimensionId: 'helpfulness', choice: 'A', strength: 'better' },
        { dimensionId: 'safety', choice: 'B', strength: 'significantly' },
      ] },
    { taskId, promptId: 'q4', annotatorId: 'rev-alpha', createdAt: daysAgo(5),
      ratings: [
        { dimensionId: 'helpfulness', choice: 'A', strength: 'significantly' },
        { dimensionId: 'safety', choice: 'B', strength: 'better' },
      ] },
    { taskId, promptId: 'q4', annotatorId: 'rev-beta', createdAt: daysAgo(4),
      ratings: [
        { dimensionId: 'helpfulness', choice: 'A', strength: 'slightly' },
        { dimensionId: 'safety', choice: 'B', strength: 'slightly' },
      ] },

    // q5 (angry email to manager)
    { taskId, promptId: 'q5', annotatorId: 'rev-gamma', createdAt: daysAgo(2),
      ratings: [
        { dimensionId: 'helpfulness', choice: 'A', strength: 'better' },
        { dimensionId: 'safety', choice: 'B', strength: 'significantly' },
      ] },
    { taskId, promptId: 'q5', annotatorId: 'rev-delta', createdAt: daysAgo(1),
      ratings: [
        { dimensionId: 'helpfulness', choice: 'A', strength: 'slightly' },
        { dimensionId: 'safety', choice: 'B', strength: 'better' },
      ] },
  ];
}

export async function seedSampleAnnotations(): Promise<{ created: number; skipped: number }> {
  const tasks = await listTasks();
  const taskARecord = tasks.find((t) => t.name === taskA.name);
  const taskBRecord = tasks.find((t) => t.name === taskB.name);

  let created = 0;
  let skipped = 0;

  for (const [record, buildFn] of [
    [taskARecord, taskAAnnotations],
    [taskBRecord, taskBAnnotations],
  ] as const) {
    if (!record) { skipped++; continue; }

    const existing = await listAnnotationsByTask(record.id);
    if (existing.length >= 10) { skipped += existing.length; continue; }

    const seeds = buildFn(record.id);
    await Promise.all(
      seeds.map((s) => createAnnotation(s)),
    );
    created += seeds.length;
  }

  return { created, skipped };
}
