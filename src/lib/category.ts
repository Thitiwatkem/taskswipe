export type TaskCategory =
  | "assignment"
  | "class"
  | "reading"
  | "studying"
  | "exam"
  | "group_project"
  | "career"
  | "networking"
  | "party"
  | "reception"
  | "errand"
  | "appointment"
  | "travel"
  | "other";

export interface CategoryMeta {
  label: string;
  gradient: string;
}

export const CATEGORY_META: Record<TaskCategory, CategoryMeta> = {
  assignment: { label: "Assignment", gradient: "from-amber-400 to-orange-500" },
  class: { label: "Class", gradient: "from-indigo-500 to-blue-600" },
  reading: { label: "Reading", gradient: "from-stone-400 to-amber-700" },
  studying: { label: "Studying", gradient: "from-slate-500 to-slate-700" },
  exam: { label: "Exam", gradient: "from-rose-500 to-red-600" },
  group_project: { label: "Group Project", gradient: "from-teal-400 to-emerald-600" },
  career: { label: "Career", gradient: "from-blue-800 to-indigo-900" },
  networking: { label: "Networking", gradient: "from-orange-400 to-rose-500" },
  party: { label: "Party", gradient: "from-pink-500 to-fuchsia-600" },
  reception: { label: "Reception", gradient: "from-orange-400 to-amber-600" },
  errand: { label: "Errand", gradient: "from-lime-500 to-green-600" },
  appointment: { label: "Appointment", gradient: "from-cyan-500 to-sky-600" },
  travel: { label: "Travel", gradient: "from-sky-400 to-blue-500" },
  other: { label: "Other", gradient: "from-slate-300 to-slate-400" },
};

// Ordered so more specific keywords are checked before generic ones.
const CATEGORY_KEYWORDS: [TaskCategory, RegExp][] = [
  ["travel", /\btravel\b|\bimmersion trip\b|\bflight\b|\bconference\b(?!.*call)|\bstudy abroad\b/i],
  ["networking", /\bnetworking\b|\balumni\b.*\b(chat|coffee|event)\b|\brecruiter\b/i],
  ["career", /\bresume\b|\brecruiting\b|\binterview\b|\bcareer\b|\badvize\b|\blaunchpad\b|\bact team\b|\bcase interview\b/i],
  ["group_project", /\b(group|team|learning team)\b.*\b(project|problem set|pset|assignment|paper)\b|\bgroup project\b|\bbuild-a-thon\b|\bbuildathon\b/i],
  ["reception", /\breception\b|\bmixer\b|\bhappy hour\b/i],
  ["party", /\bparty\b|\bsocial\b|\bmingl(e|ing)\b|\bcelebration\b/i],
  ["errand", /\bpick ?up\b|\bpay\b.*\b(bill|tuition|fee)\b|\bdrop off\b|\bmail\b/i],
  ["appointment", /\bappointment\b|\boffice hours?\b|\bcoffee chat\b|\b1:1\b|\badvising\b|\bmeeting\b/i],
  ["exam", /\bexam\b|\bmidterm\b|\bfinal\b(?!.*project)/i],
  ["class", /\bclass session\b|\blecture\b|\bseminar\b|\borientation\b|\bworkshop\b/i],
  ["reading", /\breading\b|\bpre-class\b|\barticle\b|\bcase\b(?!.*(write-up|analysis))/i],
  ["studying", /\bstudy\b|\bstudying\b|\bquiz\b|\bcheck-in\b|\breview\b/i],
  ["assignment", /\bassignment\b|\bproblem set\b|\bpset\b|\bwrite-up\b|\bworksheet\b|\bupload\b|\bsubmit\b|\bdiscussion post\b|\bhomework\b|\bapply\b|\bapplication\b|\bsurvey\b/i],
];

export function categorizeTask(input: { title: string; description?: string }): TaskCategory {
  const text = `${input.title} ${input.description ?? ""}`;
  for (const [category, pattern] of CATEGORY_KEYWORDS) {
    if (pattern.test(text)) return category;
  }
  return "other";
}
