import type { Lesson } from "@/content/types";

export const companySheetsLesson: Lesson = {
  id: "dsa-the-sheet-company-sheets",
  slug: "company-sheets",
  moduleSlug: "the-sheet",
  title: "Company-Wise Sheets, and How Much Signal They Carry",
  summary:
    "What a company list is actually a sample of, the three ways that sample is biased, and the one use for it that survives the criticism.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Say what a company-tagged list is a sample of, and what it is not",
    "Name the three biases that distort it",
    "Use a company list for calibration rather than for coverage",
    "Decide how late in preparation to look at one",
  ],
  sections: [
    {
      id: "what-it-is-a-sample-of",
      heading: "What it is a sample of",
      body: [
        "A company-tagged list is a sample of *what candidates remembered and chose to report*, filtered through whatever platform collected it, over some window of time nobody states.",
        "It is not a sample of the company's question bank. Question banks rotate, and a heavily reported question is the one a company can most easily see has leaked — so the entries most likely to be on a list are also among the likeliest to have been retired.",
        "That is worth stating plainly because the lists are treated as if they were the bank. They are closer to a survey with an unknown response rate, an unknown date range, and a known incentive for the interesting entries to be removed.",
      ],
    },
    {
      id: "the-three-biases",
      heading: "The three biases",
      body: [
        "**Reporting bias.** People report the memorable, which means the hard and the unusual. The routine question that most candidates actually got is under-represented precisely because it was routine.",
        "**Staleness, with a twist.** Every list is out of date, and the twist is that it is *selectively* out of date: the questions most likely to have been retired are the ones most likely to be on the list, since being widely reported is what makes a leak visible.",
        "**Survivorship.** Lists are assembled disproportionately from people who passed and were pleased to write it up. What the people who failed were asked is missing, and there is no reason to assume it is the same distribution.",
        "None of that makes the lists useless. It makes them a weak, noisy signal that should not be allowed to displace the ordered sheet \u2014 and displacing it is exactly what they do, because they arrive with a specific company attached and therefore feel much more actionable than \"work through two pointers properly\".",
      ],
      pitfalls: [
        {
          title: "Treating a company list as the syllabus",
          body: "It is a survey with an unknown response rate and a bias towards the memorable and the retired. Working it as a syllabus means working an unordered list of mostly-hard problems -- which is the previous lesson's premature-attempt problem with a logo on it.",
        },
        {
          title: "Grinding a company list early",
          body: "Early is when the ordered sheet is doing the most work and a company list can do the least, because you have not covered enough for calibration to mean anything. It also feels productive, which is what makes it costly.",
        },
        {
          title: "Reading a signal into the absence of a topic",
          body: "A pattern missing from a list is much more likely to be under-reported than genuinely not asked. Absence in a biased sample is not evidence.",
        },
      ],
    },
    {
      id: "the-use-that-survives",
      heading: "The use that survives",
      body: [
        "There is one, and it is calibration rather than coverage.",
        "In the last week or two before an interview, with the ordered sheet finished or nearly, a company list tells you three genuinely useful things. **Difficulty band** \u2014 whether this place asks mostly medium or leans hard. **Format** \u2014 one question or two, forty-five minutes or sixty, whether design shows up. **House style** \u2014 some companies lean towards graphs and grids, some towards strings and parsing. Those are stable properties of a hiring process in a way that individual questions are not, and they survive all three biases because they are properties of the *distribution* rather than of its members.",
        "Used that way, the list changes your last week and nothing before it. That is the correct amount of influence for a noisy sample.",
        "The other legitimate use is as a source of statements for the recognition drill \u2014 you need statements you have not solved, and a company list is a convenient pile of them. But that is using it as a bag of problems, which has nothing to do with the company tag.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How much attention do you pay to company-specific question lists?",
      answer:
        "A little, and late. A company list is a sample of what candidates remembered and chose to report, not a sample of the question bank -- and it is biased three ways: towards the memorable rather than the routine, towards questions that have been retired precisely because they leaked, and towards people who passed and wrote it up. So I would not use one as a syllabus. What survives the criticism is calibration in the last week or two: the difficulty band, the format, and whether the place leans towards graphs or strings. Those are properties of the distribution rather than of individual questions, so the biases matter much less. Before that, the ordered sheet is doing more for me than any list can.",
    },
  ],
  takeaways: [
    "A company list samples what candidates reported, not the question bank",
    "Reporting bias favours the memorable over the routine",
    "Staleness is selective: the widely reported questions are the likeliest to have been retired",
    "Survivorship: what the people who failed were asked is missing",
    "A pattern's absence from a biased sample is not evidence it is not asked",
    "The surviving use is calibration — difficulty band, format, house style",
    "Calibration belongs in the last week or two, and changes nothing before it",
    "A company list is also just a pile of unseen statements for the recognition drill",
  ],
};
