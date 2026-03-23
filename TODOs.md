# TODOs

<!-- last-id: 2 -->

## [T-001] Add automated tests
**Status:** planned
**Added:** 2026-03-23
**Description:** Add automated tests so we can test everything locally before trying on different projects.
**Questions:**
- [x] What test framework?: "Jest"
- [x] What scope?: "Both unit and integration - helpers + full init flows with mocked prompts"

**Plan:**
1. Install Jest as a dev dependency and configure it in `package.json`
2. Create a `tests/` directory at the repo root
3. Write unit tests for utility functions (`prompt`, `select`, `copyTemplate`, `runClaudeCli`, etc.) using mocks for `inquirer`, `fs`, and `child_process`
4. Write integration tests for each init flow (HTML, Vite, React) by mocking all prompt answers and asserting on files created and commands called
5. Add a `test` script to `package.json` that runs Jest
6. Verify all tests pass

---

## [T-002] Show Claude CLI output while running
**Status:** pending
**Added:** 2026-03-23
**Description:** Claude CLI is currently invoked in a way that hides its output - using the -p flag (print/non-interactive mode) and a PowerShell wrapper that buffers output. The user sees nothing until it finishes or fails. Fix all invocations to stream Claude's output live to the terminal so it's visible in real time.
**Questions:**
_(none)_

**Plan:**
_(empty)_

---
