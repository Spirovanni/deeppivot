import { getArchetype } from "@/src/lib/actions/archetype";
import {
  getDashboardSummary,
  type DashboardSummary,
} from "@/src/lib/actions/dashboard";
import { getPredictiveInsights } from "@/src/lib/actions/predictive-insights";
import {
  CareerArchetypeCard,
  CareerArchetypeEmptyCard,
} from "@/components/dashboard/CareerArchetypeCard";
import { CareerPlanProgressWidget } from "@/components/dashboard/CareerPlanProgressWidget";
import { InterviewSummaryWidget } from "@/components/dashboard/InterviewSummaryWidget";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import { RecentInterviewsWidget } from "@/components/dashboard/RecentInterviewsWidget";
import { PredictiveInsightsWidget } from "@/components/dashboard/PredictiveInsightsWidget";
import type { TraitScore } from "@/src/lib/archetypes";
import { getGamificationStatus } from "@/src/lib/actions/gamification";
import { GamificationHub } from "@/components/dashboard/GamificationHub";

const EMPTY_SUMMARY: DashboardSummary = {
  careerPlan: { total: 0, completed: 0, inProgress: 0 },
  interviews: { total: 0, completed: 0, recent: [], hoursPracticed: 0 },
};

async function loadArchetype() {
  try {
    return await getArchetype();
  } catch (err) {
    console.error("[Dashboard] loadArchetype:", err);
    return null;
  }
}

async function loadSummary(): Promise<DashboardSummary> {
  try {
    return await getDashboardSummary();
  } catch (err) {
    console.error("[Dashboard] loadSummary:", err);
    return EMPTY_SUMMARY;
  }
}

async function loadInsights() {
  try {
    return await getPredictiveInsights();
  } catch (err) {
    console.error("[Dashboard] loadInsights:", err);
    return null;
  }
}

async function loadGamification() {
  try {
    return await getGamificationStatus();
  } catch (err) {
    console.error("[Dashboard] loadGamification:", err);
    return null;
  }
}

export async function DashboardWidgets() {
  const [archetype, summary, predictiveInsights, gamificationStatus] =
    await Promise.all([
      loadArchetype(),
      loadSummary(),
      loadInsights(),
      loadGamification(),
    ]);

  return (
    <>
      {/* Onboarding */}
      <OnboardingBanner
        hasCompletedInterviews={summary.interviews.completed > 0}
        hasArchetype={!!archetype}
        hasCareerPlan={summary.careerPlan.total > 0}
      />

      {/* Progress overview */}
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <CareerPlanProgressWidget
          total={summary.careerPlan.total}
          completed={summary.careerPlan.completed}
          inProgress={summary.careerPlan.inProgress}
        />
        <InterviewSummaryWidget
          total={summary.interviews.total}
          completed={summary.interviews.completed}
          hoursPracticed={summary.interviews.hoursPracticed}
        />
        <GamificationHub status={gamificationStatus} />
      </div>

      {/* Recent interviews */}
      {summary.interviews.recent.length > 0 && (
        <div className="mb-8">
          <RecentInterviewsWidget sessions={summary.interviews.recent} />
        </div>
      )}

      {/* Predictive insights */}
      {predictiveInsights && predictiveInsights.length > 0 && (
        <div className="mb-8">
          <PredictiveInsightsWidget insights={predictiveInsights} />
        </div>
      )}

      {/* Career Archetype */}
      <div className="mb-8">
        {archetype ? (
          <CareerArchetypeCard
            archetypeName={archetype.archetypeName}
            traits={(archetype.traits ?? []) as TraitScore[]}
            strengths={archetype.strengths ?? []}
            growthAreas={archetype.growthAreas ?? []}
            assessedAt={archetype.assessedAt}
          />
        ) : (
          <CareerArchetypeEmptyCard />
        )}
      </div>
    </>
  );
}
