/**
 * Initial dataset extracted from user's "Job Search.xlsx"
 * Automatically loaded on first run so user doesn't lose any existing tracking.
 */
export const INITIAL_JOBS = [
  {
    id: "job_bright_money",
    company: "Bright Money",
    role: "SDE Intern - Backend",
    appliedDate: "2026-09-29",
    status: "Applied",
    packageLpa: "12 LPA",
    packageNumeric: 12.0,
    workMode: "On-site",
    jobLink: "https://brightmoney.com/careers",
    nextMilestoneDate: "",
    milestoneType: "Application Review",
    channel: "Trichy Specific",
    contactPerson: "",
    location: "Trichy / Bangalore",
    notes: "Backend engineering intern position. Focus on Python, APIs, and databases.",
    prepChecklist: [
      { id: "c1", text: "Revise Database & SQL indexing", done: false },
      { id: "c2", text: "Practice Python concurrency & async", done: false }
    ],
    interviewRounds: [],
    createdAt: "2026-09-29T10:00:00.000Z",
    updatedAt: "2026-09-29T10:00:00.000Z"
  },
  {
    id: "job_goldman_sachs",
    company: "Goldman Sachs",
    role: "Summer Analyst",
    appliedDate: "2026-09-29",
    status: "Applied",
    packageLpa: "NA",
    packageNumeric: null,
    workMode: "On-site",
    jobLink: "https://www.goldmansachs.com/careers",
    nextMilestoneDate: "",
    milestoneType: "Hiring Aptitude Assessment",
    channel: "Trichy Specific",
    contactPerson: "",
    location: "Bangalore / Hyderabad",
    notes: "Summer Analyst campus hiring program.",
    prepChecklist: [
      { id: "c3", text: "Review Math & Probability puzzles", done: false },
      { id: "c4", text: "Practice LeetCode medium questions", done: false }
    ],
    interviewRounds: [],
    createdAt: "2026-09-29T10:30:00.000Z",
    updatedAt: "2026-09-29T10:30:00.000Z"
  },
  {
    id: "job_booking_holdings",
    company: "Booking Holdings India",
    role: "Software Engineer - Early Career",
    appliedDate: "2026-09-29",
    status: "Shortlisted",
    packageLpa: "17 LPA",
    packageNumeric: 17.0,
    workMode: "On-site",
    jobLink: "https://careers.bookingholdings.com",
    nextMilestoneDate: "2026-10-10T14:00",
    milestoneType: "Coding Assessment / Hackerrank",
    channel: "Trichy Specific",
    contactPerson: "Recruiting Coordinator",
    location: "Bangalore",
    notes: "High priority opportunity! Top compensation bracket in pipeline.",
    prepChecklist: [
      { id: "c5", text: "Practice Dynamic Programming & Trees", done: true },
      { id: "c6", text: "Review System Design basics (Caching, Load Balancers)", done: false }
    ],
    interviewRounds: [
      { roundName: "Resume Screening", status: "Passed", date: "2026-09-30", notes: "Shortlisted for OA" }
    ],
    createdAt: "2026-09-29T11:00:00.000Z",
    updatedAt: "2026-09-30T16:00:00.000Z"
  },
  {
    id: "job_accenture",
    company: "Accenture",
    role: "ASE / AASEE",
    appliedDate: "2026-08-19",
    status: "Interview",
    packageLpa: "4.5 - 10.5 LPA",
    packageNumeric: 10.5,
    workMode: "On-site",
    jobLink: "https://www.accenture.com/in-en/careers",
    nextMilestoneDate: "2026-10-05T10:30",
    milestoneType: "Technical & HR Interview",
    channel: "Haveloc",
    contactPerson: "Campus Placement Cell",
    location: "Pan-India",
    notes: "Have to study DSA and watch some prep Videos. Focus on OOPs, DBMS, and behavioral HR questions.",
    prepChecklist: [
      { id: "c7", text: "Study DSA (Array, String, LinkedList, Stack)", done: true },
      { id: "c8", text: "Watch Accenture interview experiences & prep videos", done: false },
      { id: "c9", text: "Prepare STAR stories for HR / Behavioral round", done: false }
    ],
    interviewRounds: [
      { roundName: "Cognitive & Technical Assessment", status: "Cleared", date: "2026-08-28", notes: "Scored high in reasoning" },
      { roundName: "Coding Round", status: "Cleared", date: "2026-09-12", notes: "Solved 2/2 coding problems" }
    ],
    createdAt: "2026-08-19T09:00:00.000Z",
    updatedAt: "2026-09-28T14:30:00.000Z"
  }
];
