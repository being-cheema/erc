// Single source of truth for React Query keys shared between the admin
// panel and member-facing hooks (F1). Admin mutations must invalidate
// BOTH the admin key and the matching member key.
export const QK = {
  blogPosts: ["blog-posts"],
  trainingPlans: ["training-plans"],
  groupRuns: ["group-runs"],
  challenges: ["challenges"],
  races: ["races"],
  userRank: ["user-rank"],
  adminBlogPosts: ["admin", "blog_posts"],
  adminTrainingPlans: ["admin", "training_plans"],
  adminGroupRuns: ["admin", "group-runs"],
  adminChallenges: ["admin", "challenges"],
} as const;
