# Contributing to DevKernel

This document covers how to set the project up, how to work on it, and how to get a change reviewed and merged. For what the project is, see [README.md](README.md). For how it is built, see [INTERNALS.md](INTERNALS.md).

## Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the site](#running-the-site)
- [The gates](#the-gates)
- [Git workflow](#git-workflow)
  - [Getting the code](#getting-the-code)
  - [Pulling the latest changes](#pulling-the-latest-changes)
  - [Making a change](#making-a-change)
  - [Committing](#committing)
  - [Pushing](#pushing)
  - [Opening a pull request](#opening-a-pull-request)
  - [After review](#after-review)
  - [When a push is rejected](#when-a-push-is-rejected)
- [Adding or changing content](#adding-or-changing-content)
- [Adding a practice problem](#adding-a-practice-problem)
- [Adding a visualisation](#adding-a-visualisation)
- [Changing the code](#changing-the-code)
- [What gets a change rejected](#what-gets-a-change-rejected)
- [Reporting a problem](#reporting-a-problem)
- [License of contributions](#license-of-contributions)

## Prerequisites

Required for everything:

- Node.js 20 and npm. Continuous integration runs on Node 20. There is no `engines` field in `package.json`, so newer versions are untested rather than blocked.
- Git.

Required only to run the full lesson-code verifier locally, because it compiles and executes real programs:

| Toolchain | Used for |
| --- | --- |
| JDK 25 | Java examples |
| Python 3.13 | Python examples |
| Go 1.24 | Go examples |
| `g++` with C++20 | C++ translations |
| `rustc`, 2021 edition | Rust translations |
| NASM and `ld` | x86-64 assembly translations |

You do not need any of these to run the site, write prose, or work on the application code. Continuous integration installs all of them and runs the verifier on every push, so a missing local toolchain will not let a broken example through. The versions above are the ones the workflow pins; a recorded output is only reproducible on the toolchain it was recorded against, so if you do run the verifier locally, matching them matters.

Chromium is needed only for `npm run verify:visuals`.

## Installation

```
git clone git@github.com:prajwalkamble/DevKernel.git
cd DevKernel
npm install
```

`npm install` is the whole setup. The Pyodide and Monaco payloads are not committed; the `predev` and `prebuild` hooks copy them out of `node_modules` into `public/` automatically. To do it by hand, run `npm run assets`.

Optionally, enable the pre-commit hook, which runs the fast gates before a commit is written. Git does not pick up a hooks directory on its own:

```
git config core.hooksPath .githooks
```

Analytics needs no setup. With no `NEXT_PUBLIC_POSTHOG_KEY` in the environment, PostHog never initialises and nothing is sent. Do not add a key to a clone you are contributing from.

## Running the site

```
npm run dev
```

Then open http://localhost:3000.

To check a production build:

```
npm run build
npm start
```

Run the build before opening a pull request if you touched anything under `app/`, `components/` or `lib/`. Some failures only appear there: a component used in a visualisation needs a stable `displayName`, and minification is what breaks it, so `next build` is the only thing that catches it.

## The gates

| Command | What it checks | Roughly how long |
| --- | --- | --- |
| `npm run verify` | Type generation, `tsc --noEmit`, ESLint, the track manifest, visualisation frames | 2 minutes |
| `npm run build` | The production build | 2 minutes |
| `npm run verify:code` | Compiles and runs every lesson example and translation | 10 minutes |
| `npm run verify:visuals` | Drives a browser and checks that playback advances | Several minutes |

`npm run verify` is the pre-commit gate and the minimum before any push.

If it fails with *"manifest.generated.ts is out of date"*, run `npm run manifest` and commit the result. That file is the curriculum with the lesson bodies stripped out, and every page except the lesson route reads it instead of the real tree — importing the real tree from the root layout made every route compile all 594 lesson files and shipped the whole curriculum to the browser. Adding or renaming a lesson changes the manifest, so regenerating it is part of the same commit.

`npm run verify:code` takes a track and a module, which is how you use it while writing:

```
npm run verify:code react
npm run verify:code react concurrent-react
```

`npm run verify:visuals` needs a server already running, from either `npm run dev` or `npm run build && npm start`.

## Git workflow

### Getting the code

If you have write access to the repository, clone it directly:

```
git clone git@github.com:prajwalkamble/DevKernel.git
cd DevKernel
```

If you do not, fork it on GitHub first, clone your fork, and add the original as a second remote so you can keep up with it:

```
git clone git@github.com:<your-username>/DevKernel.git
cd DevKernel
git remote add upstream git@github.com:prajwalkamble/DevKernel.git
```

Check what you have with `git remote -v`. In a fork, `origin` is yours and `upstream` is the original.

### Pulling the latest changes

Before starting anything, get up to date. Working directly on `main`:

```
git checkout main
git pull origin main
```

From a fork:

```
git checkout main
git pull upstream main
git push origin main
```

If you are already on a working branch and `main` has moved, rebase onto it rather than merging it in. That keeps the history of your branch a straight line of your own commits:

```
git fetch origin
git rebase origin/main
```

If the rebase stops on a conflict, fix the files it names, `git add` them, and run `git rebase --continue`. To abandon the attempt and go back to where you were, `git rebase --abort`.

### Making a change

Always work on a branch. Never commit directly to `main`.

```
git checkout main
git pull origin main
git checkout -b short-description-of-the-change
```

Name the branch after what it does. Existing branches in this repository are named after the area of work, such as `react-track`.

### Committing

Check what you are about to commit, every time:

```
git status
git diff
```

Stage deliberately. Prefer naming the files over `git add .`, which is how generated output and scratch files end up in a commit:

```
git add content/tracks/react/modules/11-concurrent-react/lesson-7-the-use-hook.ts
git commit
```

Write the message in an editor rather than with `-m`, because the body matters here.

The convention in this repository is a subject line in the imperative mood, no trailing full stop, saying what the change does rather than what you did. Recent examples:

```
Settle the uncached promise on a microtask, not a timer
Give module 4 its TypeScript tab, and type the DOM the examples drive
Remove the visualisations from the front-end framework tracks
```

There is no prefix scheme, no issue-number requirement and no sign-off requirement.

The body is where the value is. Say why the change is right, not what the diff already shows. If you fixed a bug, say what the actual cause was. If you rejected an obvious alternative, say why. If you verified something, say what you ran and what it printed. A future reader wants the reasoning, which the code cannot carry on its own.

Wrap the body at about 72 columns.

If you notice a mistake in the commit you just wrote and have not pushed it yet:

```
git commit --amend
```

Do not amend or rebase commits that are already pushed and that someone else may have pulled.

### Pushing

First push of a new branch, which also sets its upstream:

```
git push -u origin your-branch-name
```

Afterwards, on the same branch:

```
git push
```

Never use `git push --force` on a shared branch. If you have rebased your own unshared branch and need to replace what is on the remote, use the safe form, which refuses if someone else has pushed in the meantime:

```
git push --force-with-lease
```

### Opening a pull request

Open the pull request against `main`.

With the GitHub CLI:

```
gh pr create --base main --head your-branch-name
```

Or from the branch page on GitHub.

The description should say what the change does, why, and what you ran to verify it. Paste the actual output of the gates rather than asserting that they pass. If the change is visible on screen, include a screenshot.

Continuous integration runs both jobs on every push and every pull request. `checks` finishes in a couple of minutes; `lesson-code` takes about ten. Both must be green before a merge. A red `lesson-code` almost always means an example's recorded output no longer matches what the program prints, and the job log names the example and shows the diff.

### After review

Push follow-up commits to the same branch. The pull request updates itself and CI re-runs. Do not force-push over review history unless you are asked to, since it detaches the comments people have already left.

Once merged, clean up:

```
git checkout main
git pull origin main
git branch -d your-branch-name
git push origin --delete your-branch-name
```

### When a push is rejected

A non-fast-forward rejection means the remote branch has commits yours does not. Fetch and rebase onto it, then push again:

```
git fetch origin
git rebase origin/your-branch-name
git push
```

Re-run the gates after a rebase. Your commits are being replayed onto a different base, and that base may have changed something they depend on.

## Adding or changing content

The rule that governs the whole curriculum: never type a program's output by hand.

Write the example, run it, and paste what it actually printed into the `output` field. Then confirm it with the verifier:

```
npm run verify:code <track> <module>
```

This is not a formality. A learner who types an example in and gets something different cannot tell whether they made the mistake or the page did, and the second time it happens they stop trusting the whole track.

The mechanics:

- A lesson lives in `content/tracks/<track>/modules/<nn-module>/lesson-n-<slug>.ts` and exports one `Lesson` object.
- Register it in the module's `index.ts`, and register the module in the track's `index.ts`. Nothing is discovered by scanning the filesystem.
- Prose fields take a small inline dialect only: `**bold**`, `*italic*` and `` `inline code` ``. Not Markdown. No raw HTML.
- Set `lang` on every example that sets `code`. The language decides the highlighting, the badge, and whether the block offers to open in the playground.
- Give an example an `output` only if it prints something. An example with no `output` is an illustration and is skipped by the verifier rather than failing.
- If an example genuinely cannot run under the verifier, because it needs a toolchain the harness cannot stand up such as a Spring application context, set `requires` to name that toolchain. Run it against the real thing, paste that output, and the verifier will report it as skipped with a reason instead of as a mismatch. Do not use `requires` to silence an example that simply fails.

Adding a translation, which is what the language dropdown offers:

- Put it in `alternates` as a `CodeVariant`. It must be a complete, runnable program that prints the same thing as the primary.
- Override `output` on the variant only when the language legitimately prints differently.
- Override `title` when the title names a file, since `db/schema.ts` in TypeScript is `db/schema.js` in JavaScript.
- The verifier compiles and runs every translation against the same expected output. A translation that has drifted from the original is exactly the failure it exists to catch.
- Translations may only offer languages the track's dropdown allows, and a primary must be paired with its counterpart: `jsx` with `tsx`, `javascript` with `typescript`. `npm run verify:frames` enforces both.

If you are writing a module that does not exist yet, `createComingSoonModule` in `content/comingSoon.ts` publishes its syllabus as a preview lesson. That is how a track can list its full shape before the lessons are written, and preview lessons are never counted as live.

## Adding a practice problem

A problem lives in `content/practice/problems/<topic>.ts` and is registered in `content/practice/index.ts`.

Write it in this order, because the order is the point of the model:

1. `statement`, `constraints` and `examples`. Write the statement in your own words.
2. `signals`. What in the statement or the constraints tells you which pattern this is. This is the field that makes a solved problem transferable, and it is the one most likely to be left thin.
3. `approaches`, ordered worst to best. The first must be a brute force. Each carries `intuition` in the order you would actually have the thought, `time` and `space` with the variable named, implementations in `java` and `python`, and a `verdict` saying why you move on or why you stop.
4. `judge`. The entry function named as the problem names it, the parameter and return types, and the cases. Include the visible examples and hidden cases beyond them, since a solution that passes only the examples in the statement is a known failure mode. Set `compare` to `unordered` or `unordered-nested` where the statement allows any order.

`patterns`, `topics` and `companies` are closed unions, so a typo is a compile error rather than a filter chip that matches nothing.

Check the problem end to end from a terminal before opening a pull request:

```
node scripts/try-judge.mjs <problem-slug> python path/to/solution.py
```

Write the statement yourself. Do not paste wording, constraints or example sets from another site.

## Adding a visualisation

Generators live in `lib/visuals/` and must be real implementations of the algorithm with `emit` calls threaded through them. Remove the emits and a correct algorithm has to remain. Do not write frames by hand, and do not write a generator that produces the frames you think the algorithm would produce.

- Every frame needs a `note`, one sentence describing that step. It is also the screen-reader text.
- Use `Recorder.bump` for the running tallies rather than tracking them separately.
- Use an existing `Role`, or add one only when the vocabulary genuinely differs. Roles are segmented on purpose: reconciliation does not borrow sorting's words.
- Register the generator in its family table, and the family in `FAMILIES` in `lib/visuals/resolve.ts`, so the picker and the resolver stay in step.
- A lesson points at it with a `visual` spec naming the `kind` and, optionally, the `algorithm`.

Then:

```
npm run verify:frames
```

That checks every generator, including entries no lesson points at, since the picker can reach all of them. If you changed the player rather than a generator, also run `npm run verify:visuals` against a running server, because a stalled animation is invisible to the frame checker.

## Changing the code

- TypeScript is `strict`. Do not reach for `any` or a non-null assertion to get past a type error.
- Keep work on the server. Highlighting, content traversal and anything else knowable at build time belongs there. Add `"use client"` only for something that genuinely needs the browser.
- Match the surrounding style. This codebase comments the reasoning behind a decision rather than restating the code, and that convention is worth keeping.
- If you touch a runtime in `lib/runtimes`, hold to its contract: anything not implemented raises `UnsupportedError` naming what was missing. Never return a plausible wrong answer. Iterate with `node scripts/try-runtime.mjs`.
- If you touch grading, remember that correctness is decided in exactly one place, `lib/judge/compare.ts`. A runtime reports what a function returned or what it threw, and never compares.
- Do not commit anything under `public/pyodide` or `public/monaco`. Both are copied from `node_modules` at build time and both are gitignored.
- Do not commit `.env.local`.

Run `npm run verify` and `npm run build` before pushing.

## What gets a change rejected

- An `output` field that was not produced by running the program.
- A translation that does not print what the primary prints.
- A visualisation frame that was authored rather than generated.
- A statement, constraint list or example set copied from another site.
- A runtime that guesses when it meets something it does not implement.
- A red `lesson-code` job. It has caught real defects, and it is not a formality to be waived.

## Reporting a problem

Open a GitHub issue. If it is wrong content, name the track, module and lesson, quote what the page says, and say what you got instead. If it is a bug in one of the tools, say which language and which browser, and include the code you ran.

## License of contributions

This project is dual licensed under MIT or Apache-2.0, at the recipient's option. Unless you state otherwise, any contribution you intentionally submit for inclusion in it is dual licensed the same way, with no additional terms or conditions.
