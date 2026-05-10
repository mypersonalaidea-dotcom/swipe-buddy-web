import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// ---- Types ----

export interface DiscoverCard {
  id: string;
  name: string;
  age: number;
  gender: string;
  city: string;
  state: string;
  profile_picture_url: string | null;
  search_type: string;
  user_habits: string[];
  looking_for_habits: string[];
  workExperience: string[];
  jobExperiencesDetailed: {
    id: string;
    position: string;
    company: string;
    companyLogo: string | null;
    fromYear: string;
    tillYear: string;
    currentlyWorking: boolean;
  }[];
  education: string[];
  educationDetailed: {
    id: string;
    institution: string;
    degree: string;
    institutionLogo?: string | null;
    startYear: string;
    endYear: string;
  }[];
  flats: any[];
}

export interface DiscoverPagination {
  page: number;
  limit: number;
  totalCards: number;
  totalPages: number;
  hasMore: boolean;
}

export interface DiscoverFeedResponse {
  cards: DiscoverCard[];
  pagination: DiscoverPagination;
}

// ---- Hooks ----

/**
 * Fetches paginated discover feed.
 * Always fetches page=1 since visited profiles are excluded server-side.
 */
export const useDiscoverFeed = (page = 1, limit = 3) => {
  return useQuery<DiscoverFeedResponse>({
    queryKey: ["discover", "feed", page, limit],
    queryFn: async () => {
      const res = await api.get("/discover/feed", {
        params: { page, limit },
      });
      return res.data.data;
    },
    staleTime: 0, // Always re-fetch to get fresh unvisited profiles
  });
};

/**
 * Marks profiles as visited so they won't appear in the feed again.
 * Idempotent — marking the same profile twice is safe.
 */
export const useMarkVisited = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profileIds: string[]) => {
      const res = await api.post("/discover/visited", {
        profile_ids: profileIds,
      });
      return res.data;
    },
    onSuccess: () => {
      // Invalidate the feed so the next fetch returns fresh unvisited profiles
      qc.invalidateQueries({ queryKey: ["discover", "feed"] });
    },
  });
};

/**
 * Clears all visited history for the current user.
 * After this, all previously-seen profiles will reappear in the feed.
 */
export const useClearVisited = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.delete("/discover/visited");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discover", "feed"] });
    },
  });
};
