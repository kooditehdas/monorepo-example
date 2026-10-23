# Per-repository agent overrides

Optional files here are appended to the factory's role prompts, after the shared rules in `AGENTS.md`:
- `implementer.md` — extra instructions for the agent that writes code (implement, fix, CI auto-fix).
- `reviewer.md` — extra instructions for the agent that reviews pull requests.

Put rules that apply to every agent in `AGENTS.md` instead.
