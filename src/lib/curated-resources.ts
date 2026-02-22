/**
 * Curated career resource catalog for goal-based recommendations.
 * Used by the career plan milestone resource suggestion feature.
 */

export type ResourceType = "article" | "course" | "tool" | "video";

export interface CuratedResource {
  title: string;
  url: string;
  resourceType: ResourceType;
  /** Keywords for matching against goal title/description (lowercase) */
  keywords: string[];
}

/** Curated career development resources with topic keywords */
export const CURATED_RESOURCES: CuratedResource[] = [
  // Leadership & Management
  {
    title: "Harvard Business Review — Leadership",
    url: "https://hbr.org/topic/subject/leadership",
    resourceType: "article",
    keywords: ["leadership", "manage", "manager", "team", "direct", "executive"],
  },
  {
    title: "Coursera — Inspiring Leadership",
    url: "https://www.coursera.org/learn/inspiring-leadership",
    resourceType: "course",
    keywords: ["leadership", "inspire", "lead", "team"],
  },
  {
    title: "MindTools — Leadership Skills",
    url: "https://www.mindtools.com/pages/main/newMN_LDR.htm",
    resourceType: "article",
    keywords: ["leadership", "manage", "skills", "team"],
  },
  // Interview prep
  {
    title: "Glassdoor — Interview Questions",
    url: "https://www.glassdoor.com/blog/guide/common-interview-questions/",
    resourceType: "article",
    keywords: ["interview", "interviewing", "questions", "behavioral", "technical"],
  },
  {
    title: "Pramp — Free Mock Interviews",
    url: "https://www.pramp.com/",
    resourceType: "tool",
    keywords: ["interview", "practice", "mock", "technical", "behavioral"],
  },
  {
    title: "LeetCode — Coding Practice",
    url: "https://leetcode.com/",
    resourceType: "tool",
    keywords: ["technical", "coding", "programming", "algorithm", "software", "developer"],
  },
  {
    title: "YouTube — STAR Method",
    url: "https://www.youtube.com/results?search_query=STAR+method+interview",
    resourceType: "video",
    keywords: ["interview", "star", "behavioral", "story", "answer"],
  },
  // Resume & job search
  {
    title: "Resume Worded — Resume Builder",
    url: "https://resumeworded.com/",
    resourceType: "tool",
    keywords: ["resume", "cv", "job", "application", "apply"],
  },
  {
    title: "LinkedIn Learning — Job Search",
    url: "https://www.linkedin.com/learning/topics/job-search",
    resourceType: "course",
    keywords: ["job", "search", "apply", "career", "hiring"],
  },
  {
    title: "Indeed Career Guide",
    url: "https://www.indeed.com/career-advice",
    resourceType: "article",
    keywords: ["job", "career", "resume", "interview", "advice"],
  },
  // PM & Product
  {
    title: "Product School — Free Resources",
    url: "https://productschool.com/blog/",
    resourceType: "article",
    keywords: ["product", "pm", "product manager", "roadmap", "agile"],
  },
  {
    title: "Reforge — Product Management",
    url: "https://www.reforge.com/blog",
    resourceType: "article",
    keywords: ["product", "pm", "growth", "strategy"],
  },
  {
    title: "Coursera — Google PM Certificate",
    url: "https://www.coursera.org/professional-certificates/google-project-management",
    resourceType: "course",
    keywords: ["product", "pm", "project", "management", "google"],
  },
  // Communication
  {
    title: "Toastmasters — Public Speaking",
    url: "https://www.toastmasters.org/",
    resourceType: "tool",
    keywords: ["communication", "speaking", "presentation", "public"],
  },
  {
    title: "Coursera — Effective Communication",
    url: "https://www.coursera.org/learn/effective-business-communication",
    resourceType: "course",
    keywords: ["communication", "writing", "speaking", "professional"],
  },
  // Data & Analytics
  {
    title: "Kaggle — Data Science",
    url: "https://www.kaggle.com/learn",
    resourceType: "course",
    keywords: ["data", "analytics", "python", "machine learning", "data science"],
  },
  {
    title: "Mode — SQL Tutorial",
    url: "https://mode.com/sql-tutorial/",
    resourceType: "article",
    keywords: ["sql", "data", "analytics", "query"],
  },
  // Design
  {
    title: "Figma — Design Basics",
    url: "https://www.figma.com/resources/learn-design/",
    resourceType: "article",
    keywords: ["design", "ux", "ui", "figma", "product design"],
  },
  {
    title: "Nielsen Norman Group — UX",
    url: "https://www.nngroup.com/articles/",
    resourceType: "article",
    keywords: ["ux", "usability", "design", "user experience"],
  },
  // General career
  {
    title: "The Muse — Career Advice",
    url: "https://www.themuse.com/advice",
    resourceType: "article",
    keywords: ["career", "advice", "job", "growth", "development"],
  },
  {
    title: "Harvard Business Review — Career",
    url: "https://hbr.org/topic/subject/career-planning",
    resourceType: "article",
    keywords: ["career", "planning", "growth", "development", "advancement"],
  },
  {
    title: "Skillshare — Career Development",
    url: "https://www.skillshare.com/browse/career-development",
    resourceType: "course",
    keywords: ["career", "skill", "learn", "development"],
  },
  // Networking
  {
    title: "LinkedIn — Networking Tips",
    url: "https://www.linkedin.com/help/linkedin/answer/42348",
    resourceType: "article",
    keywords: ["network", "networking", "linkedin", "connect"],
  },
  // Negotiation
  {
    title: "Never Split the Difference — Summary",
    url: "https://www.shortform.com/summary/never-split-the-difference-summary-chris-voss",
    resourceType: "article",
    keywords: ["negotiation", "salary", "negotiate", "offer"],
  },
  {
    title: "Levels.fyi — Salary Data",
    url: "https://www.levels.fyi/",
    resourceType: "tool",
    keywords: ["salary", "compensation", "negotiate", "offer", "tech"],
  },
];

/**
 * Recommend resources for a career goal based on keyword matching.
 * Returns up to `limit` resources sorted by relevance (match count).
 */
export function recommendResources(
  goalText: string,
  limit = 6
): Array<CuratedResource & { matchCount: number }> {
  if (!goalText?.trim()) return [];

  const terms = goalText
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (terms.length === 0) return [];

  const scored = CURATED_RESOURCES.map((r) => {
    let matchCount = 0;
    for (const kw of r.keywords) {
      if (terms.some((t) => kw.includes(t) || t.includes(kw))) matchCount++;
      if (terms.includes(kw)) matchCount += 2; // exact keyword match
    }
    return { ...r, matchCount };
  })
    .filter((r) => r.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);

  const matched = scored.slice(0, limit);
  if (matched.length > 0) return matched;

  // Fallback: return general career resources when no keyword match
  const general = CURATED_RESOURCES.filter((r) =>
    r.keywords.some((k) =>
      ["career", "job", "advice", "development", "growth"].includes(k)
    )
  );
  return general.slice(0, limit).map((r) => ({ ...r, matchCount: 1 }));
}
