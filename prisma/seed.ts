// Seed script: creates a demo recovery batch with pre-registered holdout
// assignment, realistic debtors across regions/languages, and a few
// sealed-ground-truth amounts for meta-validation.
//
// Run with: bun run db:seed

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const STOP_PHRASES_HI = [
  'stop calling me',
  'please stop',
  "don't call again",
  'mujhe call mat karo',
  'calls band karo',
  'ab phone mat karna',
  'chhodo mujhe',
]

const REGIONS = ['IN-MH', 'IN-DL', 'IN-KA', 'IN-UP', 'IN-TN', 'IN-WB']
const LANGS = ['en', 'hi', 'hinglish']
const NAMES = ['Aarav', 'Vivaan', 'Ananya', 'Diya', 'Aditya', 'Ishaan', 'Saanvi', 'Krishna', 'Kabir', 'Myra', 'Reyansh', 'Aadhya', 'Arjun', 'Pari', 'Rohan', 'Navya', 'Sai', 'Aarohi', 'Vihaan', 'Anika']

function rand(seed: number) {
  // deterministic-ish PRNG so re-seeding is stable across runs
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function maskToken(i: number) {
  // deterministic and unique: encode the index in base36, padded
  const s = i.toString(36).toUpperCase().padStart(4, '0').slice(-4)
  return `DBT-${s}`
}

async function main() {
  console.log('Seeding compliant debt-recovery demo data...')

  // Clean slate
  await db.auditEvent.deleteMany()
  await db.stopRuleEvent.deleteMany()
  await db.escalationGate.deleteMany()
  await db.optOutRecord.deleteMany()
  await db.recoveryAttempt.deleteMany()
  await db.debtor.deleteMany()
  await db.recoveryBatch.deleteMany()

  // --- Batch 1: RUNNING, pre-registered holdout ---
  const batch1 = await db.recoveryBatch.create({
    data: {
      name: 'Q4-2024-NPL-Cohort-A',
      region: 'IN',
      mandateLevel: 'STANDARD',
      holdoutRatio: 0.2,
      status: 'RUNNING',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    },
  })

  // --- Batch 2: CLOSED & SEALED (meta-validation ground truth) ---
  const batch2 = await db.recoveryBatch.create({
    data: {
      name: 'Q3-2024-NPL-Cohort-B',
      region: 'IN',
      mandateLevel: 'STANDARD',
      holdoutRatio: 0.2,
      status: 'SEALED',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 75),
      closedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
    },
  })

  const allDebtors: { id: string; batchId: string; isHoldout: boolean; lang: string; outstanding: number; recovered: number; optedOut: boolean }[] = []

  for (let i = 0; i < 60; i++) {
    const r = rand(i + 1)
    const isHoldout = r < batch1.holdoutRatio
    const lang = LANGS[Math.floor(rand(i + 100) * LANGS.length)]
    const outstanding = 5000 + Math.floor(rand(i + 200) * 95000)
    // treated debtors recover more (treatment effect ~ +28%)
    const baseRate = isHoldout ? 0.18 : 0.46
    const recovered = Math.floor(outstanding * baseRate * (0.7 + rand(i + 300) * 0.6))
    const optedOut = rand(i + 400) < 0.12

    const d = await db.debtor.create({
      data: {
        batchId: batch1.id,
        token: maskToken(i + 1),
        region: REGIONS[i % REGIONS.length],
        preferredLanguage: lang,
        outstandingAmount: outstanding,
        recoveredAmount: recovered,
        isHoldout,
        optOut: optedOut,
        optOutReason: optedOut ? 'CUSTOMER_REQUEST' : null,
        currentLevel: Math.min(3, Math.floor(rand(i + 500) * 4)),
        attemptCountTotal: Math.floor(rand(i + 600) * 6),
        lastAttemptAt: new Date(Date.now() - Math.floor(rand(i + 700) * 1000 * 60 * 60 * 48)),
      },
    })
    allDebtors.push({ id: d.id, batchId: batch1.id, isHoldout, lang, outstanding, recovered, optedOut })

    // a few attempts per debtor
    const attemptCount = 1 + Math.floor(rand(i + 800) * 4)
    for (let a = 0; a < attemptCount; a++) {
      const outcomeRoll = rand(i * 10 + a + 900)
      let outcome = 'NO_ANSWER'
      let amount = 0
      if (outcomeRoll < 0.35) { outcome = 'PAID'; amount = Math.floor(outstanding * (0.1 + rand(i + a + 950) * 0.4)) }
      else if (outcomeRoll < 0.55) { outcome = 'PROMISE_TO_PAY' }
      else if (outcomeRoll < 0.7) { outcome = 'CONTACTED' }
      else if (outcomeRoll < 0.78) { outcome = 'REFUSED' }
      else if (outcomeRoll < 0.82 && !isHoldout) { outcome = 'STOP_REQUESTED' }

      await db.recoveryAttempt.create({
        data: {
          batchId: batch1.id,
          debtorId: d.id,
          channel: a % 3 === 0 ? 'SMS' : 'VOICE',
          escalationLevel: Math.min(3, Math.floor(a / 2)),
          outcome,
          amountCollected: amount,
          transcriptSnippet: outcome === 'STOP_REQUESTED' ? STOP_PHRASES_HI[Math.floor(rand(i + a + 1000) * STOP_PHRASES_HI.length)] : null,
          attemptedAt: new Date(Date.now() - Math.floor(rand(i + a + 1100) * 1000 * 60 * 60 * 72)),
        },
      })

      if (outcome === 'STOP_REQUESTED') {
        const phrase = STOP_PHRASES_HI[Math.floor(rand(i + a + 1200) * STOP_PHRASES_HI.length)]
        const isHinglish = /mat|band|karna|chhodo/i.test(phrase)
        await db.optOutRecord.create({
          data: {
            debtorId: d.id,
            source: 'VOICE',
            reason: 'STOP_PHRASE_DETECTED',
            rawPhrase: phrase,
            language: isHinglish ? 'hinglish' : 'en',
          },
        })
        await db.stopRuleEvent.create({
          data: {
            batchId: batch1.id,
            debtorId: d.id,
            rawPhrase: phrase,
            detectedLanguage: isHinglish ? 'hinglish' : 'en',
            matchedRule: isHinglish ? 'STOP_HINGLISH' : 'STOP_EN',
            actionTaken: 'HALT_OUTREACH',
            confidence: 0.92 + rand(i + a + 1300) * 0.07,
          },
        })
      }
    }

    // a couple of escalation gates for treated debtors above level 1
    if (!isHoldout && d.currentLevel >= 2) {
      await db.escalationGate.create({
        data: {
          batchId: batch1.id,
          debtorId: d.id,
          fromLevel: d.currentLevel - 1,
          toLevel: d.currentLevel,
          status: rand(i + 1400) < 0.7 ? 'APPROVED' : 'PENDING',
          approver: rand(i + 1500) < 0.7 ? 'agent.ravi' : null,
          rationale: 'Customer non-responsive at prior rung; escalation justified per mandate.',
          decidedAt: rand(i + 1600) < 0.7 ? new Date(Date.now() - 1000 * 60 * 60 * 12) : null,
        },
      })
    }
  }

  // --- Batch 2 debtors (sealed ground truth) ---
  const sealedRecovered: { isHoldout: boolean; recovered: number; outstanding: number }[] = []
  for (let i = 0; i < 40; i++) {
    const r = rand(i + 5000)
    const isHoldout = r < batch2.holdoutRatio
    const outstanding = 5000 + Math.floor(rand(i + 5100) * 95000)
    const baseRate = isHoldout ? 0.16 : 0.43
    const recovered = Math.floor(outstanding * baseRate * (0.7 + rand(i + 5200) * 0.6))
    await db.debtor.create({
      data: {
        batchId: batch2.id,
        token: maskToken(i + 1000),
        region: REGIONS[i % REGIONS.length],
        preferredLanguage: LANGS[i % LANGS.length],
        outstandingAmount: outstanding,
        recoveredAmount: recovered,
        isHoldout,
        optOut: rand(i + 5300) < 0.1,
        attemptCountTotal: Math.floor(rand(i + 5400) * 5),
      },
    })
    sealedRecovered.push({ isHoldout, recovered, outstanding })
  }

  // --- Batch 3: older sealed batch (different mandate, for batch comparison) ---
  const batch3 = await db.recoveryBatch.create({
    data: {
      name: 'Q2-2024-NPL-Cohort-C',
      region: 'IN',
      mandateLevel: 'ENHANCED',
      holdoutRatio: 0.25,
      status: 'SEALED',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 135),
      closedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 105),
    },
  })
  for (let i = 0; i < 50; i++) {
    const r = rand(i + 6000)
    const isHoldout = r < batch3.holdoutRatio
    const outstanding = 5000 + Math.floor(rand(i + 6100) * 95000)
    const baseRate = isHoldout ? 0.14 : 0.51
    const recovered = Math.floor(outstanding * baseRate * (0.7 + rand(i + 6200) * 0.6))
    await db.debtor.create({
      data: {
        batchId: batch3.id,
        token: maskToken(i + 2000),
        region: REGIONS[i % REGIONS.length],
        preferredLanguage: LANGS[(i + 1) % LANGS.length],
        outstandingAmount: outstanding,
        recoveredAmount: recovered,
        isHoldout,
        optOut: rand(i + 6300) < 0.08,
        attemptCountTotal: Math.floor(rand(i + 6400) * 6),
      },
    })
  }

  // --- Audit events (spread across time for the timeline) ---
  const auditBase = [
    { batchId: batch3.id, actor: 'system', action: 'BATCH_STARTED', detail: 'Pre-registered holdout ratio 0.25 sealed. Mandate: ENHANCED.', daysAgo: 135 },
    { batchId: batch3.id, actor: 'agent.priya', action: 'ESCALATION_APPROVED', detail: 'Rung 2 → 3 for DBT-2003 (Legal Referral).', daysAgo: 120 },
    { batchId: batch3.id, actor: 'system', action: 'STOP_RULE_TRIGGERED', detail: 'Hinglish stop phrase "calls band karo" detected; outreach halted.', daysAgo: 110 },
    { batchId: batch3.id, actor: 'operator@console', action: 'BATCH_SEALED', detail: 'Ground truth locked. Incremental recovery: ₹8.92L across 38 treated.', daysAgo: 105 },
    { batchId: batch2.id, actor: 'system', action: 'BATCH_STARTED', detail: 'Pre-registered holdout ratio 0.20 sealed.', daysAgo: 75 },
    { batchId: batch2.id, actor: 'agent.ravi', action: 'ESCALATION_APPROVED', detail: 'Rung 1 → 2 for DBT-100A.', daysAgo: 60 },
    { batchId: batch2.id, actor: 'system', action: 'STOP_RULE_TRIGGERED', detail: 'Hinglish stop phrase "mujhe call mat karo" detected; outreach halted.', daysAgo: 50 },
    { batchId: batch2.id, actor: 'operator@console', action: 'BATCH_SEALED', detail: 'Ground truth amounts locked for meta-validation.', daysAgo: 45 },
    { batchId: batch1.id, actor: 'system', action: 'BATCH_STARTED', detail: 'Pre-registered holdout ratio 0.20 sealed. Methodology pre-registered.', daysAgo: 14 },
    { batchId: batch1.id, actor: 'agent.ravi', action: 'ESCALATION_APPROVED', detail: 'Rung 1 → 2 for DBT-001G.', daysAgo: 7 },
    { batchId: batch1.id, actor: 'system', action: 'STOP_RULE_TRIGGERED', detail: 'Hinglish stop phrase "ab phone mat karna" detected; outreach halted.', daysAgo: 3 },
    { batchId: batch1.id, actor: 'agent.priya', action: 'ESCALATION_REJECTED', detail: 'Rung 2 → 3 rejected for DBT-0013 (insufficient mandate).', daysAgo: 1 },
  ]
  await db.auditEvent.createMany({
    data: auditBase.map((a) => ({
      batchId: a.batchId,
      actor: a.actor,
      action: a.action,
      detail: a.detail,
      at: new Date(Date.now() - a.daysAgo * 1000 * 60 * 60 * 24),
    })),
  })

  console.log('Seed complete.')
  console.log(`  Batch 1 (${batch1.id}): ${allDebtors.length} debtors, ${allDebtors.filter(d => d.isHoldout).length} holdout — RUNNING`)
  console.log(`  Batch 2 (${batch2.id}): ${sealedRecovered.length} sealed debtors`)
  console.log(`  Batch 3 (${batch3.id}): 50 sealed debtors (ENHANCED mandate)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
