import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface FlatRoom {
  id: string;
  room_name?: string | null;
  room_type: "private" | "shared" | "studio";
  rent: number;
  security_deposit: number;
  brokerage: number;
  available_count: number;
  available_from: string | null;
  furnishing_type?: string;
  room_amenities: string[];
  photos: string[];
  media: { media_url: string; media_type: string }[];
}

export interface Flat {
  id: string;
  address: string;
  city: string;
  state: string;
  user_id: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  furnishing_type: string;
  flat_type?: string | null;
  description?: string;
  is_published: boolean;
  user: {
    id: string;
    name: string;
    age?: number;
    gender?: string;
    profile_picture_url: string | null;
    workExperience?: string[];
    education?: string[];
    user_habits?: string[];
  };
  rooms: FlatRoom[];
  common_amenities: string[];
  photos: string[];
  media: { media_url: string; media_type: string }[];
}

export const useFlats = (filters?: Record<string, any>) => {
  return useQuery<Flat[]>({
    queryKey: ["flats", filters],
    queryFn: async () => {
      const res = await api.get("/flats", { params: filters });
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
    select: (data) => data ?? [],
  });
};

export const useFlatById = (id: string | undefined) => {
  return useQuery<Flat>({
    queryKey: ["flats", id],
    queryFn: async () => {
      const res = await api.get(`/flats/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateFlat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { [key: string]: any }) => {
      const res = await api.post("/flats", data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["flats"] }),
  });
};

export const useUpdateFlat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const res = await api.put(`/flats/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flats"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
