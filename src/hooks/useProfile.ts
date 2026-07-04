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
  company: { id: string; name: string; website?: string; logo_url: string | null } | null;
  position: { id: string; full_name: string; common_name: string } | null;
}

export interface ProfileEducation {
  id: string;
  institution_name: string | null;
  degree_name: string | null;
  start_year: string | null;
  end_year: string | null;
  display_order: number;
  institution: { id: string; name: string; logo_url?: string | null } | null;
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

export interface SearchPreferences {
  id: string;
  flat_filter_enabled: boolean;
  min_rent: number;
  max_rent: number;
  flat_types: string[];
  furnishing_types: string[];
  habits: string[];
  age_min: number;
  age_max: number;
  location_search?: string;
  location_range_km?: number;
  latitude?: number;
  longitude?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  date_of_birth?: string;
  gender?: string;
  city?: string;
  state?: string;
  search_type?: "flat" | "flatmate" | "both";
  is_published?: boolean;
  phone_verified?: boolean;
  email_verified?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  profile_picture_url?: string | null;
  search_preferences?: SearchPreferences;
  job_experiences?: ProfileJob[];
  education_experiences?: ProfileEducation[];
  user_habits?: ProfileHabit[] | string[];
  looking_for_habits?: ProfileHabit[] | string[];
  workExperience?: string[];
  education?: string[];
  my_habits?: string[];
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

// ---- Mapper: API → ProfileCard-compatible format ----
// The backend returns snake_case keys and nested Prisma relations.
// ProfileCard expects camelCase keys with a specific structure.
// This function bridges the gap in a single, reusable place.

function mapApiToProfile(raw: any): any {
  if (!raw) return null;

  // ── Habits (flatten from { habit: { label } } → string[]) ────────────
  const myHabits: string[] = Array.isArray(raw.user_habits)
    ? raw.user_habits
        .map((uh: any) => (typeof uh === 'string' ? uh : uh.habit?.label || uh.habit_label))
        .filter(Boolean)
    : [];

  const lookingForHabits: string[] = Array.isArray(raw.looking_for_habits)
    ? raw.looking_for_habits
        .map((uh: any) => (typeof uh === 'string' ? uh : uh.habit?.label || uh.habit_label))
        .filter(Boolean)
    : [];

  // ── Job Experiences (structured objects for rich display) ─────────────
  const jobExperiences: any[] = Array.isArray(raw.job_experiences)
    ? raw.job_experiences.map((job: any) => ({
        id: job.id,
        position: job.position?.common_name || job.position_name || '',
        company: job.company?.name || job.company_name || '',
        companyLogo: job.company?.logo_url || null,
        companyWebsite: job.company?.website || null,
        fromYear: job.from_year || '',
        tillYear: job.till_year || '',
        currentlyWorking: job.currently_working || false,
      })).filter((j: any) => j.position || j.company)
    : (raw.jobExperiencesDetailed?.length
        ? raw.jobExperiencesDetailed
        : (raw.workExperience ?? []));

  // ── Education Experiences (structured objects for rich display) ───────
  const educationExperiences: any[] = Array.isArray(raw.education_experiences)
    ? raw.education_experiences.map((edu: any) => ({
        id: edu.id,
        institution: edu.institution?.name || edu.institution_name || '',
        degree: edu.degree?.common_name || edu.degree_name || '',
        institutionLogo: edu.institution?.logo_url || null,
        startYear: edu.start_year || '',
        endYear: edu.end_year || '',
      })).filter((e: any) => e.institution || e.degree)
    : (raw.educationDetailed?.length
        ? raw.educationDetailed
        : (raw.education ?? []));

  // ── Flat Details (first active flat → structured flatDetails) ─────────
  let flatDetails: any = undefined;
  const flat = Array.isArray(raw.flats) && raw.flats.length > 0 ? raw.flats[0] : null;
  if (flat) {
    flatDetails = {
      id: flat.id,
      address: flat.address ?? '',
      coordinates: flat.latitude != null && flat.longitude != null
        ? [Number(flat.longitude), Number(flat.latitude)] as [number, number]
        : undefined,
      flatType: flat.flat_type ?? '',
      furnishingType: flat.furnishing_type ?? '',
      description: flat.description ?? '',
      commonAmenities: Array.isArray(flat.common_amenities)
        ? flat.common_amenities
            .map((ca: any) => {
              if (typeof ca === 'string') return { name: ca, icon_name: '' };
              return { name: ca.amenity?.name || ca.name, icon_name: ca.amenity?.icon_name || ca.icon_name || '' };
            })
            .filter((a: any) => Boolean(a.name))
        : [],
      commonPhotos: Array.isArray(flat.photos)
        ? flat.photos
        : (flat.media ?? [])
            .filter((m: any) => m.media_type === 'image')
            .map((m: any) => m.media_url)
            .filter(Boolean),
      rooms: (flat.rooms ?? []).map((r: any) => ({
        id: r.id,
        name: r.room_name || undefined,
        type: r.room_type ?? 'private',
        rent: `₹${Number(r.rent || 0).toLocaleString()}/mo`,
        available: r.available_count ?? 1,
        securityDeposit: r.security_deposit ? `${r.security_deposit} Month` : '',
        brokerage: r.brokerage ? `${r.brokerage} days` : '',
        availableFrom: r.available_from ?? '',
        furnishingType: r.furnishing_type ?? flat.furnishing_type ?? '',
        description: r.description ?? '',
        amenities: Array.isArray(r.room_amenities)
          ? r.room_amenities
              .map((ra: any) => {
                if (typeof ra === 'string') return { name: ra, icon_name: '' };
                return { name: ra.amenity?.name || ra.name, icon_name: ra.amenity?.icon_name || ra.icon_name || '' };
              })
              .filter((a: any) => Boolean(a.name))
          : [],
        photos: Array.isArray(r.photos)
          ? r.photos
          : (r.media ?? [])
              .filter((m: any) => m.media_type === 'image')
              .map((m: any) => m.media_url)
              .filter(Boolean),
      })),
    };
  }

  return {
    // Pass through all raw fields so other consumers still work
    ...raw,
    // Override with ProfileCard-compatible keys
    profilePicture: raw.profile_picture_url ?? '',
    searchType: (raw.search_type === 'flatmate' || raw.search_type === 'both' || (Array.isArray(raw.flats) && raw.flats.length > 0))
      ? 'flatmate'
      : 'flat',
    myHabits,
    lookingForHabits,
    jobExperiences,
    educationExperiences,
    flatDetails,
  };
}

export const usePublicProfile = (id: string | undefined) => {
  return useQuery<any>({
    queryKey: ["profile", id],
    queryFn: async () => {
      try {
        console.log(`[usePublicProfile] Fetching profile for ID: ${id}`);
        const res = await api.get(`/profile/${id}`);
        console.log("[usePublicProfile] API Response:", res.data);
        const raw = res.data.data || res.data;
        return mapApiToProfile(raw);
      } catch (err: any) {
        console.error(`[usePublicProfile] Error fetching profile ${id}:`, err?.response?.data || err.message);
        throw err;
      }
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

export const useUpdateSearchPreferences = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: Record<string, any>) => {
      const res = await api.put("/profile/search-preferences", preferences);
      return res.data?.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
};
