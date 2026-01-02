# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

Tests are run with Vitest, though no test script is currently in package.json.

## Project Architecture

This is **NeuroLex**, an AI-powered spaced repetition dictionary application built with Next.js 16 App Router. The app combines traditional flashcard learning with AI-generated quizzes for vocabulary acquisition.

### Tech Stack
- **Frontend**: Next.js 16.1 + React 19.2 + TypeScript
- **Database**: Dexie (IndexedDB wrapper) for client-side storage
- **Styling**: Tailwind CSS v4 with glassmorphism design
- **Animations**: Framer Motion
- **Testing**: Vitest

### Core Architecture

#### Database Layer (`lib/db.ts`)
The app uses Dexie with three main tables:
- `terms`: Dictionary entries (id, content, definition, context, createdAt)
- `progress`: SM-2 algorithm state per term (nextReview, interval, repetition, efactor, history)
- `settings`: Singleton (id=1) storing API config and XP

Key: IndexedDB is versioned. Current schema is version 2 with an XP migration.

#### Spaced Repetition (`lib/srs.ts`)
Implements the SM-2 algorithm with custom grading:
- Grade 0-5 scale (5 = perfect, 0 = blackout)
- Calculates next interval, repetition count, and easiness factor
- Sets next review at 4:00 AM of the scheduled day

#### AI Integration (`lib/ai.ts`)
All AI calls go through `/api/ai-proxy` to handle CORS. Two main operations:
1. `generateQuiz()` - Creates quizzes with types: definition, context, scenario, multiple_choice, cloze
2. `evaluateAnswer()` - Grades responses 0-5 using SuperMemo standards

Quiz type preference is stored in the study session state.

#### Study Flow (`hooks/useStudySession.ts`)
The custom hook manages the entire study session state machine:
- States: selection → loading → question → evaluating → feedback → finished/error
- Two modes: `standard` (flashcard) and `ai` (LLM-generated quizzes)
- Handles AI quiz generation, answer evaluation, and XP rewards

#### Service Layer (`lib/services/`)
Business logic is isolated in services:
- `study-service.ts`: `getDueItems()` retrieves terms due for review, `saveSessionProgress()` updates SRS state and awards XP

### Key Patterns

1. **Client-side only**: All data lives in IndexedDB. No server-side state.
2. **Reactive queries**: Uses `dexie-react-hooks` for live queries
3. **Path aliases**: `@/*` maps to project root
4. **Type safety**: Full TypeScript coverage with strict mode
5. **State management**: React hooks + custom hooks, no external state library

### Important File Locations
- `app/api/ai-proxy/route.ts` - Next.js API route for AI calls
- `app/page.tsx` - Dashboard with stats
- `app/study/page.tsx` - Main study session UI
- `lib/types.ts` - All TypeScript interfaces
- `hooks/useStudySession.ts` - Study session state machine

### Testing
Test files exist for core algorithms:
- `lib/srs.test.ts` - SM-2 algorithm tests
- `lib/ai.test.ts` - AI integration tests

When adding new quiz types or modifying SRS logic, update these tests.

### Data Management
- Import/export functionality in `lib/db.ts` exports terms + progress as JSON
- Settings stored in IndexedDB, not localStorage
- API keys never leave the client
