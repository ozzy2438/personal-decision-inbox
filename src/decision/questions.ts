import { choice, noul, score } from "@typesafe-ai/sdk";

/**
 * Single speculative fan-out. Question IDs are for code; meaning lives in
 * instructions and criteria. Nested state is referenced with backticked paths.
 */
export function buildQuestionPayload() {
  return {
    bucket: {
      type: "choice" as const,
      instructions:
        "Which inbox bucket does `title` plus `body` belong in for the person who owns this inbox?",
      criteria: {
        decide:
          "The owner must choose, approve, refuse, or pick among options.",
        fyi: "Useful context with no action required of the owner.",
        noise: "Marketing, receipts, automated notices, or bulk mail.",
        waiting: "Progress is blocked on someone other than the owner.",
        commitment:
          "The owner already promised something and must follow through.",
      },
    },
    needs_my_decision: {
      type: "noul" as const,
      instructions:
        "Does `title` plus `body` require a personal judgment from the inbox owner?",
      criteria: {
        true: "A choice, approval, refusal, or RSVP sits with the owner.",
        false: "No personal call is required.",
      },
    },
    needs_reply: {
      type: "noul" as const,
      instructions: "Does this item expect a reply from the inbox owner?",
      criteria: {
        true: "Someone is waiting on a response from the owner.",
        false: "No reply is expected.",
      },
    },
    is_time_sensitive: {
      type: "noul" as const,
      instructions:
        "Does `title` plus `body` convey a deadline, ASAP, or a time that will pass?",
      criteria: {
        true: "Explicit time pressure or a dated deadline.",
        false: "No timing pressure is expressed.",
      },
    },
    waiting_on_other: {
      type: "noul" as const,
      instructions:
        "Is progress blocked on someone other than the inbox owner?",
      criteria: {
        true: "Another person or team still owes work or a reply.",
        false: "Nothing is waiting on someone else.",
      },
    },
    safe_to_auto_file: {
      type: "noul" as const,
      instructions:
        "Would it be a reversible, low-harm mistake to file this away without the owner seeing it today?",
      criteria: {
        true: "Filing it is easy to undo and would not miss a real decision.",
        false: "Filing it could hide something the owner should handle.",
      },
    },
    domain: {
      type: "choice" as const,
      instructions: "Which life domain is this item primarily about?",
      criteria: {
        work: "Job, colleagues, projects, or professional scheduling.",
        personal: "Household, family logistics, or private admin.",
        money: "Invoices, offers, spending, or compensation.",
        health: "Medical, appointments, or wellbeing.",
        legal: "Contracts, signatures, counsel, or compliance.",
        social: "Friends, events, RSVPs, or community.",
        other: "None of the other domains fit.",
      },
    },
    stakes: {
      type: "score" as const,
      instructions:
        "How hard is a wrong call to undo, given `title` and `body`?",
      criteria: [
        "Reversible and low harm if ignored or misfiled.",
        "Moderate cost or awkwardness if handled late or wrongly.",
        "Hard to undo: money, legal, health, or a relationship.",
      ] as const,
    },
    urgency: {
      type: "score" as const,
      instructions: "How soon does this need attention?",
      criteria: [
        "Can wait; no timing pressure.",
        "This week, or a soft deadline.",
        "Today, overdue, or an explicit ASAP.",
      ] as const,
    },
  };
}

export function buildSdkQuestions() {
  const payload = buildQuestionPayload();
  return {
    bucket: choice(payload.bucket.instructions, payload.bucket.criteria),
    needs_my_decision: noul(
      payload.needs_my_decision.instructions,
      payload.needs_my_decision.criteria,
    ),
    needs_reply: noul(
      payload.needs_reply.instructions,
      payload.needs_reply.criteria,
    ),
    is_time_sensitive: noul(
      payload.is_time_sensitive.instructions,
      payload.is_time_sensitive.criteria,
    ),
    waiting_on_other: noul(
      payload.waiting_on_other.instructions,
      payload.waiting_on_other.criteria,
    ),
    safe_to_auto_file: noul(
      payload.safe_to_auto_file.instructions,
      payload.safe_to_auto_file.criteria,
    ),
    domain: choice(payload.domain.instructions, payload.domain.criteria),
    stakes: score(payload.stakes.instructions, payload.stakes.criteria),
    urgency: score(payload.urgency.instructions, payload.urgency.criteria),
  };
}
