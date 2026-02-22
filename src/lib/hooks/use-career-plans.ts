"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

export const PLANS_QUERY_KEY = ["career-plans"] as const;

export interface PlanResource {
  id: number;
  title: string;
  url: string;
  resourceType: string;
  createdAt: string;
}

export interface PlanMilestone {
  id: number;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  resources: PlanResource[];
}

async function fetchPlans(): Promise<PlanMilestone[]> {
  const res = await fetch("/api/plans");
  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to fetch plans");
  }
  return res.json();
}

export function useCareerPlans() {
  return useQuery({
    queryKey: PLANS_QUERY_KEY,
    queryFn: fetchPlans,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      targetDate?: string;
      status?: string;
    }) => {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create plan");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { title?: string; description?: string; targetDate?: string; status?: string };
    }) => {
      const res = await fetch(`/api/plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to update plan");
      }
      return res.json();
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: PLANS_QUERY_KEY });
      const previous = queryClient.getQueryData<PlanMilestone[]>(PLANS_QUERY_KEY);
      queryClient.setQueryData<PlanMilestone[]>(PLANS_QUERY_KEY, (old) =>
        old?.map((m) =>
          m.id === id
            ? {
                ...m,
                ...data,
                targetDate: data.targetDate ?? m.targetDate,
                updatedAt: new Date().toISOString(),
              }
            : m
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PLANS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/plans/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to delete plan");
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PLANS_QUERY_KEY });
      const previous = queryClient.getQueryData<PlanMilestone[]>(PLANS_QUERY_KEY);
      queryClient.setQueryData<PlanMilestone[]>(PLANS_QUERY_KEY, (old) =>
        old?.filter((m) => m.id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PLANS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY });
    },
  });
}

export function useReorderPlans() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: number[]) => {
      const res = await fetch("/api/plans/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to reorder plans");
      }
    },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: PLANS_QUERY_KEY });
      const previous = queryClient.getQueryData<PlanMilestone[]>(PLANS_QUERY_KEY);
      queryClient.setQueryData<PlanMilestone[]>(PLANS_QUERY_KEY, (old) => {
        if (!old?.length) return old ?? [];
        const byId = new Map(old.map((m) => [m.id, m]));
        return orderedIds
          .map((id, index) => {
            const m = byId.get(id);
            return m ? { ...m, orderIndex: index } : null;
          })
          .filter((m): m is PlanMilestone => m !== null);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PLANS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY });
    },
  });
}

export function useAddResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      milestoneId,
      data,
    }: {
      milestoneId: number;
      data: { title: string; url: string; resourceType?: string };
    }) => {
      const res = await fetch(`/api/plans/${milestoneId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to add resource");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY });
    },
  });
}

export function useRemoveResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      milestoneId,
      resourceId,
    }: { milestoneId: number; resourceId: number }) => {
      const res = await fetch(
        `/api/plans/${milestoneId}/resources/${resourceId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to remove resource");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY });
    },
  });
}
