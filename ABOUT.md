# openai-codex-plugins

> Fork of openai/plugins, the curated OpenAI Codex plugin-example collection, kept for preparing upstream submissions.

**Family:** plugins · **Type:** library · **Lifecycle:** experimental · **Owner:** cching-openai (upstream); forked into the org for upstream submission work

## What it does
Mirrors the upstream `openai/plugins` repository: a large curated collection of Codex plugin examples (figma, notion, build-ios/macos/web-apps, expo, netlify, remotion, and many more). Each plugin lives under `plugins/<name>/` with a required `.codex-plugin/plugin.json` manifest plus optional skills, agents, commands, hooks, and MCP surfaces. Also carries a `.agents/skills/plugin-creator` skill and a marketplace manifest. The fork exists so changes can be prepared and submitted upstream.

## How it fits
- Depends on: —
- Used by: —
- External: upstream github.com/openai/plugins; the third-party services the example plugins integrate (Figma, Notion, Netlify, etc.)

## Runtime & data
- Runs: nowhere as a service; plugin examples are consumed by the OpenAI Codex CLI
- Data in: —
- Data out: plugin bundles/manifests installed into Codex

## Links
- [Upstream openai/plugins](https://github.com/openai/plugins)

<!-- Maintained by the maintaining-project-map skill. Do not hand-edit; regenerated. -->
