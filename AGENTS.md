# Spec workshop kit: rules for coding agents

This repo is a teaching kit. `starter/` is a fictional service that coding agents are asked to change; everything else measures the result. Layout and commands are in `README.md`.

## Rules

- Do not run an agent task inside this repo. Run `node scripts/reset-demo.mjs` and work in `~/spec-workshop-live/<variant>/`. Inside this repo the agent would inherit this file and could read `solution/`.
- `starter/` is the experiment's starting point. After any change to it, run `node scripts/verify.mjs starter` (24 tests pass, feature checks NOT OBSERVED) and `node scripts/verify.mjs solution` (10 of 10).
- `solution/` is hand-written. Never present it as agent output.
- `fallback/runs/` holds real recorded runs. Never edit a transcript, diff, or scorecard by hand. Record a new run with `node scripts/record-run.mjs`.
- The acceptance suite tests over HTTP only. Never import target code from `acceptance/`.
- No dependencies. Node 20+ built-ins only.
- No real customer data. All tenants, people, and domains are fictional.
