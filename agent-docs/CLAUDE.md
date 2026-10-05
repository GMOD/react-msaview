# Agent documentation

Top level is exactly `TODO.md` and this file. Everything else is filed:

- `reference/` — settled: how a subsystem works, the decisions behind a route,
  and measurements with their numbers.
- `ideas/` — a proposal parked, one per file, in the subfolder naming what it
  waits on: `ready/` (only the work). Each file carries `name:` and
  `description:` frontmatter, the description written as the hook someone picks
  the idea up by. A verdict leaves `ideas/`: an ADR if the decision deserves a
  record, otherwise deleted. Moving a file between folders is how its status
  changes.
- `handoffs/` — live unfinished state. Pointers, not content.
- Tried and declined → a sentence at the code that would re-try it, with the
  number. There is no rejected-ideas shelf.
- What a session did and which commits → git already holds it.

Cite a doc by its path, so a move is a grep. "State as of \<date\>" in a doc
means split it into the homes above.
