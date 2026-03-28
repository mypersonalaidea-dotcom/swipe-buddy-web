import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface MasterCompany {
  id: string;
  name: string;
  logo_url: string | null;
  website?: string;
}

export interface MasterPosition {
  id: string;
  full_name: string;
  common_name: string;
  other_names?: string[];
}

export interface MasterInstitution {
  id: string;
  name: string;
  logo_url?: string | null;
}

export interface MasterDegree {
  id: string;
  full_name: string;
  common_name: string;
  other_names?: string[];
}

export interface MasterHabit {
  id: string;
  category: string;
  label: string;
  icon_name: string;
  display_order: number;
}

export interface MasterAmenity {
  id: string;
  name: string;
  amenity_type: "room" | "common";
  icon_name: string;
  display_order: number;
}

const STALE_TIME = 10 * 60 * 1000; // 10 minutes — master data rarely changes

export const useCompanies = (enabled = true) => {
  return useQuery<MasterCompany[]>({
    queryKey: ["master", "companies"],
    queryFn: async () => {
      const res = await api.get("/master/companies");
      return res.data.data;
    },
    enabled,
    staleTime: STALE_TIME,
    select: (data) => data ?? [],
  });
};

export const usePositions = (enabled = true) => {
  return useQuery<MasterPosition[]>({
    queryKey: ["master", "positions"],
    queryFn: async () => {
      const res = await api.get("/master/positions");
      return res.data.data;
    },
    enabled,
    staleTime: STALE_TIME,
    select: (data) => data ?? [],
  });
};

export const useInstitutions = (enabled = true) => {
  return useQuery<MasterInstitution[]>({
    queryKey: ["master", "institutions"],
    queryFn: async () => {
      const res = await api.get("/master/institutions");
      return res.data.data;
    },
    enabled,
    staleTime: STALE_TIME,
    select: (data) => data ?? [],
  });
};

export const useDegrees = (enabled = true) => {
  return useQuery<MasterDegree[]>({
    queryKey: ["master", "degrees"],
    queryFn: async () => {
      const res = await api.get("/master/degrees");
      return res.data.data;
    },
    enabled,
    staleTime: STALE_TIME,
    select: (data) => data ?? [],
  });
};

export const useHabits = () => {
  const { isAuthenticated } = useAuth();
  return useQuery<MasterHabit[]>({
    queryKey: ["master", "habits"],
    queryFn: async () => {
      const res = await api.get("/master/habits");
      return res.data.data;
    },
    enabled: isAuthenticated,
    staleTime: STALE_TIME,
    select: (data) => data ?? [],
  });
};

export const useAmenities = () => {
  const { isAuthenticated } = useAuth();
  return useQuery<MasterAmenity[]>({
    queryKey: ["master", "amenities"],
    queryFn: async () => {
      const res = await api.get("/master/amenities");
      return res.data.data;
    },
    enabled: isAuthenticated,
    staleTime: STALE_TIME,
    select: (data) => data ?? [],
  });
};
