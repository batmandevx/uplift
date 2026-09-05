# uplift

**SealedRecovery — Compliant Debt-Recovery Orchestration & Causal Analytics Command Center**

A production-grade, compliance-first operations dashboard for automated debt-recovery batches. Built with Next.js 16, React 19, Tailwind CSS v4, Prisma, Recharts, and Framer Motion.

---

## 🌟 Core Pillars

1. **Measured Money Recovered (Causal Uplift)**
   - Pre-registered randomized holdout cohorts
   - Wilson Score 95% Confidence Intervals
   - Continuous meta-validation and ground-truth comparison against sealed batches

2. **Compliant Escalation Ladder**
   - 4-rung escalation model: Soft Reminder → Standard Call → Enhanced Outreach → Legal Notice Referral
   - Human-approval gating mechanism for rungs ≥ 2
   - Enforcement of attempt caps and quiet hours clock (IST)

3. **Hinglish Stopping Rules**
   - Live Hinglish stop-phrase detection as a first-class language (Romanized & Devanagari)
   - LLM-assisted fuzzy intent classification
   - Instant outreach suppression with immutable audit trail logging

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI & Styling**: React 19, Tailwind CSS v4, shadcn/ui components, Glassmorphism design system
- **Typography**: Inter & Geist Mono
- **Database & ORM**: SQLite / Prisma ORM
- **Visualization**: Recharts & Framer Motion
- **Runtime**: Bun / Node.js

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
bun install
# or
npm install
```

### 2. Database Setup
```bash
bun run db:generate
bun run db:push
bun run db:seed
```

### 3. Start Development Server
```bash
bun run dev
# or
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## ⌨️ Keyboard Shortcuts

- `S` — Focus live Stop-Rule Simulator
- `T` — Toggle Light / Dark theme
- `B` — Focus Batch Selector
- `⌘K` / `Ctrl+K` — Open Command Palette
- `?` — Show Keyboard Help dialog

---

## 📜 License

MIT
