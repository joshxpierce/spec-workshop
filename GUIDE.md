# Step-by-step guide: learn to write specs with this repo

Eight short steps, about 45 minutes in total. Each step says what to do and what you should see. Steps 3 and 5 run a coding agent; every other step is reading and writing.

You can also hand this guide to your coding agent and let it walk you through. Open your agent in this folder and paste:

> Read README.md and GUIDE.md. Walk me through GUIDE.md one step at a time. Run the commands for me, explain what I should see, and wait for me before moving to the next step.

## Step 0. Set up (3 minutes)

1. Check Node: `node --version`. You need 20 or newer.
2. Clone the repo: `git clone https://github.com/joshxpierce/spec-workshop.git`
3. Go into it: `cd spec-workshop`
4. Build the practice folders: `node scripts/reset-demo.mjs`
   You should see "clean starter state" three times, for `weak`, `strong`, and `rules`. They live in `~/spec-workshop-live/`, outside this repo, on purpose (see the FAQ in the README).
5. Check the scorecard works: `node scripts/verify.mjs solution`
   The last line should read `10 passed of 10 checks`.

## Step 1. See the problem (5 minutes)

1. Read the ticket: [`prompts/weak.txt`](prompts/weak.txt). It is one sentence, as a customer would write it.
2. Before reading on, write down three things an agent would have to guess to build it.
3. Read what a real agent did with it: [`fallback/runs/weak/transcript.md`](fallback/runs/weak/transcript.md).
4. Read its score: [`fallback/runs/weak/verify.txt`](fallback/runs/weak/verify.txt).
   You should see 9 of 10 checks passed, and a scope section flagging files the agent changed without being asked.

The lesson: the agent did reasonable work, but it made product decisions on its own (what to log, which files to touch, how SPF interacts with the allowlist) and told you afterwards.

## Step 2. Read a strong spec (5 minutes)

1. Open [`pack/spec-template.md`](pack/spec-template.md). It has the nine elements: outcome, context, scope, requirements, constraints, dependencies, acceptance criteria, tests, escalation.
2. Open [`prompts/strong.md`](prompts/strong.md) next to it. It is the same ticket as step 1, written against the template.
3. For each of your three guesses from step 1, find the line in the spec that removes the guess.
4. Read what the agent did with the spec: [`fallback/runs/strong/transcript.md`](fallback/runs/strong/transcript.md). Its score is 10 of 10.

## Step 3. Run both yourself (5 minutes, optional)

Skip this step if you do not have a coding agent set up. The recorded runs in step 1 and 2 show the same thing. Each run costs about $0.50 in agent usage.

1. Open your agent in the weak folder. For Claude Code: `cd ~/spec-workshop-live/weak && claude`
2. Paste the sentence from `prompts/weak.txt` as the first message. Let it finish (about a minute).
3. Open your agent in the strong folder: `cd ~/spec-workshop-live/strong && claude --permission-mode plan`
4. Send: `Read specs/allowlist.md and carry it out.`
5. Read the plan it shows you before you approve it. That is checkpoint one.
6. From the repo folder, score both:
   `node scripts/verify.mjs ~/spec-workshop-live/weak`
   `node scripts/verify.mjs ~/spec-workshop-live/strong`

Your results may differ from the recordings. Agents vary run to run.

## Step 4. Write your own spec (12 minutes)

1. Reset the weak folder to a clean starter: `node scripts/reset-demo.mjs weak`
2. Copy the template into it:
   `mkdir -p ~/spec-workshop-live/weak/specs && cp pack/spec-template.md ~/spec-workshop-live/weak/specs/my-spec.md`
3. Pick a task from [`pack/practice-tickets.md`](pack/practice-tickets.md). Each ticket already says who is affected, what is wrong, and which files to read.
4. Read `starter/README.md` and `starter/CONTRIBUTING.md` (about 3 minutes). They describe the service and its house rules.
5. Fill in `~/spec-workshop-live/weak/specs/my-spec.md`. Spend most of your time on scope, acceptance criteria, and escalation. Those are where agents guess.

## Step 5. Run your spec (5 minutes)

1. Open your agent in the folder: `cd ~/spec-workshop-live/weak && claude --permission-mode plan`
2. Send: `Read specs/my-spec.md and carry it out.`
3. Read the plan. If it makes a decision your spec did not, note it down before approving.

## Step 6. Score and diagnose (5 minutes)

1. From the repo folder: `node scripts/verify.mjs ~/spec-workshop-live/weak`
   - Ticket 1 (allowlist) gets the full scorecard.
   - Tickets 2 and 3 use section 1 (do existing tests still pass?) and section 3 (which files changed?).
2. Score the run with [`pack/rubric.md`](pack/rubric.md).
3. For each miss, ask: did my spec say this? If no, it is a spec defect: add the missing line and run again. If yes, it is an agent limit: note it and escalate.
4. Before you reset, copy your spec somewhere outside `~/spec-workshop-live/`. Resetting deletes it.

## Step 7. Move repeat lessons into standing rules (5 minutes)

1. Look at the lines you added in step 6. For each one, ask: is this true for every task in this repo, or only this one?
2. Lines true for every task belong in `AGENTS.md`. Compare [`standing-rules/AGENTS.md`](standing-rules/AGENTS.md) with the short spec in [`prompts/strong-with-rules.md`](prompts/strong-with-rules.md): the spec is less than half the length because the rules carry the rest.
3. Try it: `node scripts/reset-demo.mjs rules`, then run `Read specs/allowlist.md and carry it out.` in `~/spec-workshop-live/rules`, and score it.

Next: "Diving deeper" in the [README](README.md) covers doing this in your own repo.
