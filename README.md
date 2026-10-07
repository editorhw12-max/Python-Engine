# POMEGRANATE × LILY — Python Atelier

Python Atelier is a mobile-first, browser-based Python workbench with a real Pyodide runtime, interactive console, local file workspace, beginner-focused Atelier Coach, and a structured learning layer.

## Product layers

- **Workbench** — write, run, debug, import, export, and autosave real Python files.
- **Atelier Practice** — five CS50P Foundations challenges with bounded hints, controlled self-checks, and learner reflection.
- **Seeds** — once-only rewards for challenge completion, required reflection, and eligible debugging recovery.
- **Atelier Garden** — an optional SVG/CSS pomegranate plant grown by investing earned Seeds.
- **Practice Record** — local challenge history, completion snapshots, reflections, Seed accounting, and JSON backup.

The coding loop remains central:

```
Choose Challenge
→ Write Code
→ Run
→ Check My Work
→ Review Feedback
→ Revise if Needed
→ Reflect
→ Earn Seeds
→ Invest Seeds
→ Grow Garden
```

## Runtime architecture

The app is static and GitHub Pages compatible. The workbench lives in `app/index.html`.

- Pyodide runs inside a Web Worker.
- `coi-serviceworker.js` provides the COOP/COEP behavior needed for `SharedArrayBuffer` and interactive `input()` where the browser supports it.
- CodeMirror 5 enhances the editor when its CDN assets are available; the textarea fallback remains usable.
- Existing workspace files continue to use the original `pl.atelier.v2` localStorage structure.

The Practice layer is additive. It does not rewrite the existing workspace schema.

## Learning storage

Practice/Seed/Garden data uses:

```
pl.atelier.learning.v1
```

The stored object includes an explicit `schemaVersion: 1`. Seed totals are derived from the append-only event ledger during normal app behavior rather than stored as unrelated counters.

Where supported, learning-state read/modify/write operations use the Web Locks API for same-origin coordination. A local in-tab queue and latest-state reread are used as a fallback. That fallback is not a transaction guarantee across every browser tab or installed Home Screen context.

## Self-checks

**Run** and **Check My Work** are separate.

A normal successful Run does not complete a challenge. Self-checks use controlled test input and expected output. Only the first public case can display expected-versus-actual feedback; additional cases remain undisclosed in the learner UI.

Self-check is disabled while a normal Run is active or waiting for `input()`. Checks are not queued.

Each self-check case has a time limit. A timeout is reported as **Needs Revision**. The Python Worker is restarted after every self-check so learner code cannot leave mutated builtins or runtime state behind. Editor files remain safe, but runtime-only variables, generated files, and installed runtime packages are reset with that Worker restart.

## Completion and rewards

Challenge completion requires:

1. **Self-Check Passed** for the exact submitted source, and
2. A learner-submitted reflection containing at least 30 non-whitespace characters.

The length requirement does not prove understanding.

Version 1 awards, once per challenge:

- Completion: **+5 Seeds**
- Required reflection: **+2 Seeds**
- Eligible debugging recovery: **+2 Seeds**

Debug recovery compares the most recent definitive **Needs Revision** attempt to the later passing source using Python token-based structure. Comments and insignificant formatting are ignored where practical, while identifiers, operators, string tokens, logical structure, and meaningful indentation are preserved. A token change means the source changed; it does **not** prove that a particular edit was the reason the program became correct. Malformed source that cannot be compared reliably does not receive the debugging bonus.

## Practice Record and backups

At completion, the app stores an immutable snapshot of the exact source that passed, the challenge definition version, passing-check metadata, completion timestamp, and learner-submitted reflection.

The completed snapshot is separate from the current editable workspace. Later edits, renames, or deletion of a practice file do not rewrite historical completion.

The Practice Record is **self-reported local data**. It is not externally authenticated, tamper-proof, or a credential. Browser data can be edited or cleared.

Use **Export Learning Backup** to save a JSON copy.

Version 1 import is intentionally conservative:

- The backup is validated before application.
- Seed ledger amounts and IDs are replay-validated.
- Imported Python is treated only as text and is never executed.
- Import restores only into an **empty** learning store.
- Import refuses to merge into existing learning history. Merge support is deferred.

## Garden

Garden growth is based on lifetime **Seeds Invested**, not current balance or challenge count:

- 0 — Seed
- 1–4 — Sprout
- 5–9 — Sapling
- 10–19 — Young Tree
- 20–29 — Flowering Tree
- 30+ — Fruiting Tree

The Garden is optional. Garden growth never replaces Practice Record completion.

## Local development and deployment

The repository does not require a framework or build system. GitHub Pages serves the root landing page and the app under `/app/`.

The PWA manifest starts at `./app/` and preserves Safari Add to Home Screen / standalone behavior where supported.

## Important limitations

- Local storage is not externally authenticated.
- Exported JSON can be edited.
- Cross-context storage behavior can vary by browser and installed-app environment.
- Static self-check cases are inspectable in downloaded application source and are not secure anti-cheat tests.
- Version 1 backup import does not merge records.
- Safari standalone behavior and real-device mobile controls require manual device testing before release.

