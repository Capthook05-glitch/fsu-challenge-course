# Implementation Backlog

## Milestone 1 (MVP)
- [x] Scaffold Vite + React + Tailwind
- [x] Add Supabase client + env validation
- [x] Create SQL migration for `profiles`, `games`, `sessions`, `session_games`, `session_feedback`
- [x] Add RLS policies for facilitator/admin split
- [x] Build login/logout starter flow
- [x] Build game catalog list/grid with search and basic filters
- [x] Build session planner with drag/drop ordering
- [x] Build facilitation mode timer + offline cache
- [x] Seed starter games
- [ ] Add plain-text export

## Milestone 2
- [x] Admin game CRUD
- [ ] Bulk CSV import/export for games
- [x] Feedback form and submission
- [ ] Feedback results dashboard (aggregated analytics)
- [ ] PDF export (true PDF generation, not browser print)
- [x] Session templates
- [ ] Session duplication (direct copy, not via templates)

## Milestone 3
- [ ] Knowledge base rich text pages
- [ ] Theme customization in DB + CSS variables
- [x] Analytics dashboard (basic stats and session table)
- [ ] Multi-day and breakout tracks
