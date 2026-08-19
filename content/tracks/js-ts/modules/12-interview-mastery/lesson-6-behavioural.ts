import type { Lesson } from "@/content/types";

export const behaviouralLesson: Lesson = {
  id: "interview-behavioural",
  slug: "behavioural-questions",
  moduleSlug: "interview-mastery",
  title: "Behavioural Questions on Code Quality",
  summary:
    "Half the interview is not technical, and engineers prepare for none of it. How to structure a story, which four you should have ready, and what an interviewer is listening for in questions about quality, debt and disagreement.",
  estimatedMinutes: 35,
  objectives: [
    "Structure a story so it lands in under two minutes",
    "Prepare four stories that cover most questions asked",
    "Answer questions about quality and technical debt without platitudes",
    "Talk about a failure in a way that helps you",
    "Avoid the answers that read as red flags",
  ],
  sections: [
    {
      id: "why",
      heading: "Why this round exists",
      body: [
        "Behavioural rounds are not a personality test and they are not filler. They are trying to predict how you will behave in the situations that make teams work or not: disagreement, ambiguity, being wrong, and pressure to cut corners.",
        "Engineers under-prepare for this more than any other round, usually because it feels unfalsifiable. It is not — the answers vary enormously in quality, and the difference is almost entirely **specificity**. \"I care about code quality\" is unfalsifiable. \"I blocked a PR that added a fourth way of doing auth checks, and we spent a day consolidating the three that existed\" is a claim about a real event.",
      ],
    },
    {
      id: "structure",
      heading: "The structure that works",
      body: [
        "STAR — Situation, Task, Action, Result — is the standard, and it is standard because it works. Two adjustments make it better for engineers.",
        "**Keep Situation and Task to two sentences.** Most bad answers spend ninety seconds on context. The interviewer does not need your org chart.",
        "**Spend the time on Action, and use \"I\".** \"We decided\" tells them nothing about you. What did *you* do, propose, write, argue for?",
        "**Give a Result with a number or a concrete outcome**, and add a short reflection — what you would do differently. The reflection is what separates a story from an anecdote.",
        "Two minutes total. If you are still going at three, you have lost them.",
      ],
      examples: [
        {
          id: "star-example",
          title: "The same story, badly and well",
          lang: "bash",
          code: `Q: "Tell me about a time you improved code quality."

# Weak — vague, no action, no result.
"At my last job the codebase was pretty messy, so I spent time
 cleaning it up and adding tests. It got a lot better and the team
 was happier with it."

# Strong — specific, first person, measurable, reflective.
"S/T: Our checkout flow had no tests and was the source of about a
      third of our production incidents. Nobody wanted to touch it.

A:    I didn't propose a rewrite — I'd have lost that argument. I
      picked the three functions that appeared most often in incident
      reports, extracted the pricing logic out of the React components
      into pure functions, and wrote table tests for the edge cases we
      had actually shipped bugs in. That was about two days.

      Then I made it a rule that any PR touching checkout added a test
      for whatever it changed, which the team agreed to because the
      cost was now small.

R:    Checkout incidents went from roughly four a quarter to one over
      the following six months, and the coverage got to a useful place
      as a side effect rather than as a project.

Reflection: I'd start the same way again — the thing that worked was
      picking the highest-incident code rather than the worst code,
      and not asking for a big block of time up front."`,
          explanation:
            "Everything in the second version is checkable. It also demonstrates several things without claiming them: judgement about what argument to pick, incremental delivery, bringing a team along rather than imposing, and honest attribution of what worked. Claiming any of those directly — \"I'm pragmatic and collaborative\" — would land far worse.",
        },
      ],
      pitfalls: [
        {
          title: "\"We\" hides whether you did anything",
          body: "Engineers over-use \"we\" out of a genuine instinct that credit is shared. In an interview it makes the story unassessable — the interviewer cannot tell whether you led it, contributed to it or watched. Use \"I\" for your actions and \"we\" for the outcome. That is accurate, not immodest.",
        },
      ],
    },
    {
      id: "four-stories",
      heading: "The four stories to prepare",
      body: [
        "Most behavioural questions are variations on four themes. Prepare one story for each and you can answer almost anything asked, because a good story can be reframed to fit several questions.",
        "**A hard technical problem.** Something genuinely difficult that you solved. Have the *why it was hard* clear, not just the solution — this is where interviewers probe.",
        "**A disagreement.** With a colleague, a manager or a product owner. The interesting part is not who won; it is how you found out what the other person was optimising for.",
        "**A failure.** Something you got wrong that had real consequences. Non-negotiable, and covered below.",
        "**Something you improved without being asked.** Quality, tooling, process, documentation. This is the one that answers most \"tell me about code quality\" questions.",
        "For each, know: the constraint that made it hard, what you specifically did, the outcome, and what you would do differently. That is four facts per story and about twenty minutes of preparation total.",
      ],
    },
    {
      id: "quality-questions",
      heading: "Questions about quality and debt",
      body: [
        "These come up in almost every senior interview, and they are unusually easy to answer badly — because the naive answer sounds virtuous and reads as inexperienced.",
        "**\"How do you ensure code quality?\"** Bad answer: a list of tools. Good answer: what you do and *why that*. Automate what is mechanical — formatting, linting, types, tests in CI — so review is spent on design and correctness rather than on style. Review with questions rather than instructions. And define quality in terms of change: quality code is code that is safe and quick to change, not code that is clever.",
        "**\"How do you handle technical debt?\"** Bad answer: \"I refactor it.\" Good answer: debt is a trade, not a moral failing — some of it was the right call and should stay. Distinguish the debt that is costing you now, in incidents and slow changes, from the debt that is merely ugly. Pay the first down inside feature work where you can, and make the cost visible in terms the business understands: \"this area causes a third of our incidents\", not \"this code is bad\".",
        "**\"What if a deadline means shipping something you're not happy with?\"** Bad answer, in either direction: refusing on principle, or agreeing without comment. Good answer: ship it, be explicit about what was traded and what the risk is, write it down, and make sure someone owns the follow-up. The judgement being assessed is whether you can distinguish \"this is untidy\" from \"this will lose data\" — the first is fine to ship, the second is not, and saying that plainly is the answer.",
      ],
      examples: [
        {
          id: "quality-answer",
          title: "\"How do you ensure code quality?\"",
          lang: "bash",
          code: `# Weak — a list, with no reasoning.
"I use ESLint and Prettier, write unit tests, do code reviews,
 and try to follow best practices."

# Strong — a principle, a mechanism, and a concrete example.
"I try to make the mechanical parts automatic so that review can be
 about the things only a human can catch. Formatting, lint and types
 run in CI, so nobody spends review time on a missing semicolon or
 arguing about quotes.

 That leaves review for design and correctness, and I try to review
 with questions rather than instructions — 'what happens if this is
 empty?' surfaces the same bug as 'add a null check' but leaves the
 author owning the decision, and quite often the answer is that it
 can't be empty and I've learned something.

 The definition I actually work to is that quality code is code that's
 safe and fast to change. Clever code that nobody can modify is not
 high quality, and I've written enough of it to be confident about that."`,
          explanation:
            "The last line is doing real work. A small, specific admission — that you have written the thing you are cautioning against — makes the whole answer credible in a way that no amount of principle-stating would.",
        },
      ],
    },
    {
      id: "failure",
      heading: "The failure question",
      body: [
        "\"Tell me about a time you failed\" or \"about a bug you caused in production\". Interviewers ask it because the answer is hard to fake and because someone with no failures either has not shipped much or is not being honest.",
        "**Pick something real with real consequences.** \"I'm a perfectionist\" and \"I once missed a deadline by a day\" both read as evasion. Data loss, an outage, a decision that cost the team months — those read as experience.",
        "**Own it without theatre.** Say what you did, not what circumstances did. Equally, do not perform contrition; the interviewer wants to see analysis, not penance.",
        "**Spend most of the answer on what changed.** The failure is context; the systemic fix is the content. \"I was more careful afterwards\" is worthless — people are not reliably more careful. \"We added a confirmation step and a dry-run flag to that script\" is a change to the system, and it is what a good engineer takes from a mistake.",
      ],
      examples: [
        {
          id: "failure-answer",
          title: "A failure answer that works",
          lang: "bash",
          code: `"I deleted a production table.

 We were removing a deprecated feature and I wrote a migration to drop
 its tables. I tested it against a staging database that had been
 restored from a backup two weeks earlier — so it didn't have the
 table that a *different* team had added in the meantime, and my
 migration's name pattern matched theirs. It ran in production at 2am
 and took out about six hours of their data.

 What I did: escalated immediately rather than trying to fix it
 quietly, we restored from the previous night's backup, and they lost
 a few hours of writes.

 What actually changed: two things. Migrations that drop anything now
 require a second approver, and our staging refresh went from manual
 and occasional to nightly and automatic — the stale staging data was
 the real cause and it had bitten us in smaller ways before.

 What I'd do differently: I'd have listed the tables the migration
 would touch and read that list, rather than trusting the pattern.
 That's a thirty-second check and I do it every time now."`,
          explanation:
            "This is a serious failure told without either minimising or grovelling. Note the proportions: three sentences of what happened, one of the response, and the bulk on systemic change — including the observation that the stale staging environment was the underlying cause rather than the individual mistake. That is the analysis being assessed.",
        },
      ],
      pitfalls: [
        {
          title: "The disguised-strength answer",
          body: "\"My weakness is that I care too much\" or \"I work too hard\" is transparent, and interviewers hear it several times a week. It reads as either a lack of self-awareness or an unwillingness to be honest, and both are worse than any real weakness you could name. A genuine one with what you do about it — \"I under-communicate when I'm deep in a problem, so I now post a short status at the end of each day\" — costs you nothing and buys credibility.",
        },
      ],
    },
    {
      id: "red-flags",
      heading: "Answers that read as red flags",
      body: [
        "A short list, because these are common and each one is avoidable.",
        "**Blaming previous colleagues.** \"The team was incompetent\" tells the interviewer how you will describe *them* in a year. Describe situations, not people.",
        "**No failures, no disagreements, no weaknesses.** Reads as either inexperience or evasion.",
        "**Only \"we\", never \"I\".** Unassessable, as above.",
        "**Contempt for non-engineers.** Complaining about product managers or designers as a category is a reliable signal about how you collaborate.",
        "**Absolutes.** \"I never write code without tests.\" \"You should always use X.\" Nobody believes it, and it suggests you have not been in a situation where the trade-off was real.",
        "**Fabrication.** Interviewers ask follow-ups, and invented stories collapse at the second or third one. A modest true story survives any amount of probing; an impressive false one does not survive two minutes.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you ensure code quality on a team?",
      answer:
        "Automate what is mechanical — formatting, linting, types and tests in CI — so review time goes to design and correctness rather than style. Review with questions rather than instructions, which surfaces the same issues while leaving the author owning the decision. And define quality as code that is safe and quick to change, rather than code that is clever; that framing is what makes the trade-offs decidable rather than a matter of taste.",
    },
    {
      question: "How do you handle technical debt?",
      answer:
        "Treat it as a trade rather than a moral failing — some of it was the right call and should stay. Distinguish debt that is costing you now, in incidents and slow changes, from debt that is merely ugly, and pay down the first inside feature work where possible rather than asking for a dedicated rewrite. Make the cost visible in business terms — \"this area causes a third of our incidents\" — because \"this code is bad\" does not compete for priority.",
    },
    {
      question: "What would you do if a deadline forced you to ship something you were not happy with?",
      answer:
        "Ship it, say explicitly what was traded and what the risk is, write it down, and make sure someone owns the follow-up. The judgement is in distinguishing untidy from unsafe — duplicated code or a missing abstraction can ship, silent data loss or an unhandled auth path cannot. Refusing on principle and agreeing without comment are both wrong answers.",
    },
    {
      question: "Tell me about a time you failed.",
      answer:
        "Pick something with real consequences, own it plainly without performing contrition, and spend most of the answer on what changed systemically rather than on the incident. \"I was more careful afterwards\" is worthless because people are not reliably more careful; a process or tooling change that makes the mistake harder to repeat is what an interviewer is listening for — along with whether you can identify the underlying cause rather than just the proximate one.",
    },
    {
      question: "What questions do you have for us?",
      answer:
        "Ask two or three specific ones that are hard to answer from a careers page: what the code review process actually looks like and how long PRs wait, what the most frustrating part of the codebase is, what happened the last time something broke in production, and what success in this role looks like at six months. Answering \"no, you covered everything\" reads as disinterest, and the hesitations in the answers tell you more than the answers do.",
    },
  ],
  takeaways: [
    "Behavioural rounds predict how you handle disagreement, ambiguity, being wrong and pressure — they are not filler",
    "Specificity is the whole difference; \"I care about quality\" is unfalsifiable, a blocked PR is an event",
    "STAR with two sentences of context, the bulk on your actions in first person, and a concrete result",
    "Prepare four stories: a hard problem, a disagreement, a failure, and something you improved unasked",
    "Define quality as safe and fast to change, and automate the mechanical so review covers design",
    "Debt is a trade — separate what costs you now from what is merely ugly, and price it in business terms",
    "In a failure answer, spend the time on the systemic change, not the incident or the apology",
    "Red flags: blaming colleagues, no failures, only \"we\", contempt for non-engineers, absolutes, and fabrication",
  ],
  status: "available",
};
