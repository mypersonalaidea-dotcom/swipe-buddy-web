import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Flat } from "./useFlats";

// ---- Types ----

export interface ProfileJob {
  id: string;
  company_name: string | null;
  position_name: string | null;
  from_year: string | null;
  till_year: string | null;
  currently_working: boolean;
  display_order: number;
  company: { id: string; name: string; logo_url: string | null } | null;
  position: { id: string; name: string } | null;
}

export interface ProfileEducation {
  id: string;
  institution_name: string | null;
  degree_name: string | null;
  start_year: string | null;
  end_year: string | null;
  display_order: number;
  institution: { id: string; name: string } | null;
  degree: { id: string; common_name: string } | null;
}

export interface ProfileHabit {
  id: string;
  habit: {
    id: string;
    label: string;
    category: string;
    icon_name: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  gender?: string;
  city?: string;
  state?: string;
  search_type?: "flat" | "flatmate" | "both";
  is_published?: boolean;
  profile_picture_url?: string | null;
  job_experiences?: ProfileJob[];
  education_experiences?: ProfileEducation[];
  user_habits?: ProfileHabit[];
  looking_for_habits?: ProfileHabit[];
  flats?: Flat[];
}

// ---- Profile ----

export const useMyProfile = () => {
  const { isAuthenticated } = useAuth();
  return useQuery<UserProfile>({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      const res = await api.get("/profile");
      return res.data.data;
    },
    enabled: isAuthenticated,
  });
};

export const usePublicProfile = (id: string | undefined) => {
  return useQuery<UserProfile>({
    queryKey: ["profile", id],
    queryFn: async () => {
      const res = await api.get(`/profile/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const res = await api.put("/profile", data);
      return res.data.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(["profile", "me"], data);
    },
  });
};

// ---- Jobs ----

export const useMyJobs = () => {
  const { isAuthenticated } = useAuth();
  return useQuery<ProfileJob[]>({
    queryKey: ["profile", "jobs"],
    queryFn: async () => {
      const res = await api.get("/profile/jobs");
      return res.data.data;
    },
    enabled: isAuthenticated,
  });
};

export const useAddJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      company_id?: string | null;
      position_id?: string | null;
      company_name?: string;
      position_name?: string;
      from_year?: string;
      till_year?: string;
      currently_working?: boolean;
      display_order?: number;
    }) => {
      const res = await api.post("/profile/jobs", data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
};

export const useUpdateJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, ...data }: { jobId: string; [key: string]: unknown }) => {
      const res = await api.put(`/profile/jobs/${jobId}`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
};

export const useDeleteJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => {
      await api.delete(`/profile/jobs/${jobId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
};

// ---- Education ----

export const useMyEducation = () => {
  const { isAuthenticated } = useAuth();
  return useQuery<ProfileEducation[]>({
    queryKey: ["profile", "education"],
    queryFn: async () => {
      const res = await api.get("/profile/education");
      return res.data.data;
    },
    enabled: isAuthenticated,
  });
};

export const useAddEducation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      institution_id?: string | null;
      degree_id?: string | null;
      institution_name?: string;
      degree_name?: string;
      start_year?: string;
      end_year?: string;
      display_order?: number;
    }) => {
      const res = await api.post("/profile/education", data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
};

export const useUpdateEducation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eduId, ...data }: { eduId: string; [key: string]: unknown }) => {
      const res = await api.put(`/profile/education/${eduId}`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
};

export const useDeleteEducation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eduId: string) => {
      await api.delete(`/profile/education/${eduId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
};

// ---- Habits ----

export const useMyHabits = () => {
  const { isAuthenticated } = useAuth();
  return useQuery<ProfileHabit[]>({
    queryKey: ["profile", "habits"],
    queryFn: async () => {
      const res = await api.get("/profile/habits");
      return res.data.data;
    },
    enabled: isAuthenticated,
  });
};

export const useUpdateHabits = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (habit_ids: string[]) => {
      const res = await api.put("/profile/habits", { habit_ids });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", "habits"] }),
  });
};

// ---- Looking For ----

export const useLookingFor = () => {
  const { isAuthenticated } = useAuth();
  return useQuery<ProfileHabit[]>({
    queryKey: ["profile", "looking-for"],
    queryFn: async () => {
      const res = await api.get("/profile/looking-for");
      return res.data.data;
    },
    enabled: isAuthenticated,
  });
};

export const useUpdateLookingFor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (habit_ids: string[]) => {
      const res = await api.put("/profile/looking-for", { habit_ids });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", "looking-for"] }),
  });
};
