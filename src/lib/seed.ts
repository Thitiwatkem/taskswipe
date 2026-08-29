import type { Task, TaskSource } from "./types";
import type { TaskCategory } from "./category";
import { makeId } from "./utils";

interface SeedSpec {
  title: string;
  source: TaskSource;
  courseOrSender: string;
  dueDate: string | null;
  description: string;
  link: string | null;
  category: TaskCategory;
}

// Real tasks scraped from BruinLearn on 2026-08-28 — every open assignment
// across the user's active courses, source-of-truth linked back to Canvas.
const BRUINLEARN_SEED_SPECS: Omit<SeedSpec, "source">[] = [
  {
    title: "Group Problem Set 2",
    courseOrSender: "262-MGMTFT-403-LEC-3 Financial Accounting",
    dueDate: "2026-08-31T23:59:00",
    description: "100 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/234429/assignments/2008351",
    category: "assignment",
  },
  {
    title: "Check-in 4",
    courseOrSender: "262-MGMTFT-403-LEC-3 Financial Accounting",
    dueDate: "2026-09-03T23:59:00",
    description: "Quiz, 10 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/234429/assignments/2012317",
    category: "studying",
  },
  {
    title: "Group problem set 3",
    courseOrSender: "262-MGMTFT-403-LEC-3 Financial Accounting",
    dueDate: "2026-09-10T23:59:00",
    description: "100 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/234429/assignments/2008349",
    category: "assignment",
  },
  {
    title: "Final Exam",
    courseOrSender: "262-MGMTFT-403-LEC-3 Financial Accounting",
    dueDate: "2026-09-11T09:00:00",
    description: "100 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/234429/assignments/2008350",
    category: "exam",
  },
  {
    title: "Learning Team Peer Evaluation",
    courseOrSender: "262-MGMTFT-403-LEC-3 Financial Accounting",
    dueDate: "2026-09-18T23:55:00",
    description: "3 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/234429/assignments/2008355",
    category: "group_project",
  },
  {
    title: "Individual Case Write-Up #2: Natureview",
    courseOrSender: "262-MGMTFT-411-01/02 Marketing Management",
    dueDate: "2026-09-03T09:00:00",
    description: "5 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/234432/assignments/2005965",
    category: "assignment",
  },
  {
    title: "Major Group Project",
    courseOrSender: "262-MGMTFT-411-01/02 Marketing Management",
    dueDate: "2026-09-10T23:59:00",
    description: "24 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/234432/assignments/2005966",
    category: "group_project",
  },
  {
    title: "Discussion Contributions",
    courseOrSender: "262/26F-MGMTFT-401A/B-03 Foundations of Inclusive Leadership",
    dueDate: null,
    description: "Ongoing, 15 pts possible, no fixed due date",
    link: "https://bruinlearn.ucla.edu/courses/234426/assignments/2006742",
    category: "assignment",
  },
  {
    title: "Build-A-Thon: Parker-Easton Project Submission Deadline",
    courseOrSender: "Summer Technology Immersion 2026",
    dueDate: "2026-08-30T12:00:00",
    description: "100 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/240009/assignments/2005502",
    category: "group_project",
  },
  {
    title: "Participation",
    courseOrSender: "Summer Technology Immersion 2026",
    dueDate: null,
    description: "Ongoing, 100 pts possible, no fixed due date",
    link: "https://bruinlearn.ucla.edu/courses/240009/assignments/2005507",
    category: "class",
  },
  {
    title: "L@A Premier Track Premortem",
    courseOrSender: "Leadership@Anderson - Cohort 8",
    dueDate: "2026-10-11T23:59:00",
    description: "100 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/233745/assignments/1982421",
    category: "assignment",
  },
  {
    title: "L@A Premier Track Orientation Course",
    courseOrSender: "Leadership@Anderson - Cohort 8",
    dueDate: "2026-11-30T23:59:00",
    description: "100 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/233745/assignments/2003434",
    category: "class",
  },
  {
    title: "L@A Premier Track Participation Policy",
    courseOrSender: "Leadership@Anderson - Cohort 8",
    dueDate: "2026-11-30T23:59:00",
    description: "Quiz, 100 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/233745/assignments/1975964",
    category: "studying",
  },
  {
    title: "L@A Coaching Coach/Client Fit",
    courseOrSender: "Leadership@Anderson - Cohort 8",
    dueDate: "2026-11-30T23:59:00",
    description: "Quiz, 100 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/233745/assignments/1975969",
    category: "studying",
  },
  {
    title: "L@A Coaching Agreement",
    courseOrSender: "Leadership@Anderson - Cohort 8",
    dueDate: "2026-11-30T23:59:00",
    description: "Quiz, 100 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/233745/assignments/1975971",
    category: "studying",
  },
  {
    title: "TL-TR Progress Update #1 (2026-27 Fall)",
    courseOrSender: "Leadership@Anderson - Cohort 8",
    dueDate: "2026-12-13T23:59:00",
    description: "Quiz, 100 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/233745/assignments/2013918",
    category: "studying",
  },
  {
    title: "Problem Set 1",
    courseOrSender: "26F-MGMTFT-405-01/02/03/04 Managerial Economics",
    dueDate: "2026-09-25T23:59:00",
    description: "100 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/237882/assignments/2000674",
    category: "assignment",
  },
  {
    title: "Problem Set 2",
    courseOrSender: "26F-MGMTFT-405-01/02/03/04 Managerial Economics",
    dueDate: "2026-10-09T23:59:00",
    description: "100 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/237882/assignments/2000675",
    category: "assignment",
  },
  {
    title: "Problem Set 3",
    courseOrSender: "26F-MGMTFT-405-01/02/03/04 Managerial Economics",
    dueDate: "2026-11-06T23:59:00",
    description: "100 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/237882/assignments/2000676",
    category: "assignment",
  },
  {
    title: "Problem Set 4",
    courseOrSender: "26F-MGMTFT-405-01/02/03/04 Managerial Economics",
    dueDate: "2026-11-20T23:59:00",
    description: "100 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/237882/assignments/2000677",
    category: "assignment",
  },
  {
    title: "Problem Set 5",
    courseOrSender: "26F-MGMTFT-405-01/02/03/04 Managerial Economics",
    dueDate: "2026-12-04T23:59:00",
    description: "100 pts possible",
    link: "https://bruinlearn.ucla.edu/courses/237882/assignments/2000678",
    category: "assignment",
  },
  {
    title: "Assessment: Midterm",
    courseOrSender: "26F-MGMTFT-405-01/02/03/04 Managerial Economics",
    dueDate: null,
    description: "100 pts possible, date TBD",
    link: "https://bruinlearn.ucla.edu/courses/237882/assignments/2000671",
    category: "exam",
  },
  {
    title: "Assessment: Final Exam",
    courseOrSender: "26F-MGMTFT-405-01/02/03/04 Managerial Economics",
    dueDate: null,
    description: "100 pts possible, date TBD",
    link: "https://bruinlearn.ucla.edu/courses/237882/assignments/2000670",
    category: "exam",
  },
];

// Real action items scraped from Outlook on 2026-08-28 — no unread-newsletter
// noise, just emails that need a reply, a sign-up, or a pickup.
const EMAIL_SEED_SPECS: Omit<SeedSpec, "source">[] = [
  {
    title: "ACT Team Selection Survey",
    courseOrSender: "Parker Career Management Center",
    dueDate: "2026-09-02T23:59:00",
    description: "Submit your ACT team selection before the deadline.",
    link: null,
    category: "career",
  },
  {
    title: "Submit Onboarding Feedback Survey",
    courseOrSender: "MBA Student Affairs",
    dueDate: "2026-09-07T23:59:00",
    description:
      "Anonymous feedback survey on the first two weeks of Onboarding; entries submitted by the deadline are eligible for an Anderson-branded MiiR tumbler raffle.",
    link: null,
    category: "assignment",
  },
  {
    title: "PIER Session 2",
    courseOrSender: "Ercole, Chrissy (PIER)",
    dueDate: "2026-08-31T15:30:00",
    description: "Review the Session 1 slide deck beforehand.",
    link: null,
    category: "class",
  },
  {
    title: "Welcome to Tech @ Anderson reception",
    courseOrSender: "Easton Technology Management Center",
    dueDate: "2026-08-28T17:00:00",
    description: "Welcome reception for FTMBA/EMBA/FEMBA classes, Crown Auditorium.",
    link: null,
    category: "reception",
  },
  {
    title: "Pick up name tag/name tent",
    courseOrSender: "MBA Student Affairs",
    dueDate: null,
    description: "Ready for pickup at the Student Business Center (D-212).",
    link: null,
    category: "errand",
  },
  {
    title: "Schedule ITIN/W-7 Zoom appointment",
    courseOrSender: "Clark, Jerrod (International Students Office)",
    dueDate: null,
    description:
      "Reply with availability for a Zoom appointment: Wed 9/2 8-10am, Thu 9/3 8-9am, or Fri 9/4 8-10am. Complete your GLACIER record and send required documents at least 24 hours before the chosen slot.",
    link: null,
    category: "appointment",
  },
  {
    title: "Pick up Anderson sweatshirt",
    courseOrSender: "MBA Student Affairs",
    dueDate: null,
    description: "If missed at distribution, pick up at Student Affairs (G307), Mon-Fri 8am-5pm.",
    link: null,
    category: "errand",
  },
  {
    title: "Apply for AVIP Impact Investing Program",
    courseOrSender: "UCLA Anderson Center for Impact",
    dueDate: "2026-09-04T23:59:00",
    description:
      "Optional student-led impact investing fund; eligible as a first-year FTMBA student. Application deadline 9/4 at 11:59pm.",
    link: null,
    category: "career",
  },
  {
    title: "Pay Fall tuition & fee assessment",
    courseOrSender: "MBA Student Affairs / Bruin Bill",
    dueDate: "2026-09-11T23:59:00",
    description:
      "Review your Fall fee assessment on Bruin Bill and submit payment. Missing the deadline drops your courses and places a hold on your account.",
    link: null,
    category: "errand",
  },
  {
    title: "Sign up for a waiver exam (optional)",
    courseOrSender: "MBA Student Affairs",
    dueDate: "2026-09-01T17:00:00",
    description:
      "If you want to waive MGMTFT 405 Managerial Economics (Tue 9/1, 5-6:30pm, D301) or MGMTFT 416 Global Economics (Fri 9/4, 4:30-6pm, B313), register via the sign-up link. Optional.",
    link: null,
    category: "exam",
  },
  {
    title: "Book coffee chat with Prof. Hershfield",
    courseOrSender: "Hal Hershfield (MGMTFT-411 Marketing Management)",
    dueDate: null,
    description: "Optional office-hours coffee chat sign-up via Calendly.",
    link: null,
    category: "appointment",
  },
  {
    title: "Resolve Check-in 2 access issue",
    courseOrSender: "Kurokawa, Nathaniel (TA, MGMTFT 403 Financial Accounting)",
    dueDate: null,
    description:
      "The TA reopened Check-in 2 after you missed it, but your follow-up asking for the Zoom passcode looks unanswered — confirm whether you actually completed it.",
    link: null,
    category: "studying",
  },
  {
    title: "Upload resume v1 to Parker2028 folder",
    courseOrSender: "Parker Career Management Center",
    dueDate: "2026-08-17T09:00:00",
    description:
      "Anderson-format resume, uploaded to your Parker2028 folder in the Parker Portal. You flagged this email yourself — worth double-checking it's actually done.",
    link: null,
    category: "career",
  },
  {
    title: "Complete Advize Assignment",
    courseOrSender: "Parker Career Management Center",
    dueDate: "2026-08-17T23:59:00",
    description:
      "Watch at least 3 Advizers (30+ minutes total) and answer the 4 questions on Advize. Was due the week of Aug 17.",
    link: null,
    category: "career",
  },
  {
    title: "Complete Stage 1 on Launchpad",
    courseOrSender: "Parker Career Management Center",
    dueDate: "2026-08-10T09:00:00",
    description:
      "Upload your completed brief (or the Career Destination tab of the PCS Worksheet) to your Parker2028 folder — due before your PCS session, Mon 8/10 (Sections A/B) or Wed 8/12 (Sections C/D).",
    link: null,
    category: "career",
  },
];

const SEED_SPECS: SeedSpec[] = [
  ...BRUINLEARN_SEED_SPECS.map((spec) => ({ ...spec, source: "bruinlearn" as const })),
  ...EMAIL_SEED_SPECS.map((spec) => ({ ...spec, source: "email" as const })),
];

export function generateSeedTasks(): Task[] {
  const now = Date.now();
  return SEED_SPECS.map((spec, i) => ({
    id: makeId("seed"),
    title: spec.title,
    source: spec.source,
    courseOrSender: spec.courseOrSender,
    dueDate: spec.dueDate,
    description: spec.description,
    status: "active",
    reminderAt: null,
    createdAt: new Date(now - i * 1000).toISOString(),
    link: spec.link,
    category: spec.category,
  }));
}
