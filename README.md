# TaskSwipe

A swipe-based task triage tool for UCLA Anderson MBA students. Swipe right to mark a task done, swipe left to keep it active and set a reminder.

## Getting started

```bash
npm install
npm run dev
```

Opens with a demo backlog pre-loaded — no login, no API keys, no backend. Tasks persist to `localStorage` for the session.

## Importing real tasks

Import view → upload a `.ics` calendar export (e.g. from BruinLearn's calendar feed) to parse real assignments and class sessions. Manual add and AI-assisted paste-in are also available there.

## Stack

React + TypeScript + Vite, Tailwind CSS v4, Framer Motion for the swipe/animation layer. No backend.
