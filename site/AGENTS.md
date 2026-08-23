# x3kk - rules of engagement (AgroApp)

Call me **x3kk** in every reply. No name = this file did not load = say so and stop.

## How to work

# Engineering & Behavioral Guidelines

Follow these core principles for all code generation, architecture, reviews, and refactoring in this workspace.

### 1. Talk First (Plan Before Coding)

- **Explicit Go-Ahead Required:** Dont ask me to allow for anything since in this plan you have everything you need to understand my thinking at all times! Explain the plan in plain language and wait for explicit confirmation ("do it", "go") before touching files. Questions are never instructions to code.
- **Red Test Exception:** Red tests and clear-repro bugs get fixed directly, no permission needed.
- **Surface Ambiguity:** Don't assume. Call out hidden confusion, tradeoffs, or multiple interpretations upfront rather than picking one silently.
- **Push Back:** If a simpler approach or 50-line alternative exists for a 200-line plan, propose it before writing code.

### 2. Simplicity & Elegance First

- **Minimal Viable Implementation:** Write the minimum code needed to solve the exact problem requested. Avoid speculative features, unnecessary configurability, or premature abstractions.
- **Balanced Elegance:** For non-trivial changes, pause and ask: _"Knowing everything I know now, what is the clean solution?"_ For obvious fixes: just fix it, no ceremony.

### 3. Surgical Changes & Scope Control

- **Stay in Scope:** Fix what was asked, nothing else. Drive-by improvements and unrelated cleanups are scope creep. Propose them, do not do them.
- **Surgical Touch:** Preserve existing code style, formatting, and structure. Clean up only the unused imports/variables created by your changes.
- **Deferred Means Deferred:** Items marked deferred in memory are waiting on human input. Never resurrect them unprompted.

### 4. Verification & Fixes

- **Baseline First:** Before changing anything, run the relevant test suite and record the numbers. You cannot know what you broke if you never knew what was green.
- **Fix Everything First:** Red checks or tests: fix ALL of them, verify green locally, then report. Never hand back a partial fix. Never ask which failure to start with.
- **Verify Before Done:** Define verifiable success criteria upfront. Run the suite and show the numbers. _"Should work"_ is not done. Ask yourself: _Would a staff engineer sign off on this?_

### 5. Execution & Learning

- **Blocked Means Say Blocked:** Name the exact missing input as one clear question (never a questionnaire). Never fill gaps with guesses.
- **Break Down Tasks:** Divide multi-step work into clear steps, verifying each stage before proceeding to the next.
- **Learn From Corrections:** Every time you are corrected, write the lesson to project memory before moving on. The same mistake twice is a process failure.

## Writing

- Em dashes: **never**. Anywhere. Chat, code, comments, commits, docs, UI copy. Use " - ", a comma, or rephrase.
- Plain and direct. No filler, no marketing tone.
- Reports: outcome first, then numbers, then detail.
- App UI copy is Serbian; match it, diacritics included.

## Git

- **Never push.** I push. Never touch the remote in any way.
- **Commit every change you make.** Finish it, verify it, commit it. No asking, no green light, no handing me a dirty tree to sort out. Pushing is still mine alone.
- **Stage only the files you touched.** My tree carries stray untracked junk. `git add -A` and `git commit -a` are banned; name the paths.
- **Commit messages: one short line, lowercase, plain.** What changed, and why only if it is not obvious. No em dashes anywhere. No `Co-Authored-By`, no `Generated with`, no signature, no emoji, no body unless the change genuinely needs one.
- Never push. I push. ← restore this; it was lifted for one session
