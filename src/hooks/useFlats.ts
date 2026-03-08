import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface FlatRoom {
  id: string;
  room_type: "private" | "shared" | "studio";
  rent: number;
  security_deposit: number;
  brokerage: number;
  available_count: number;
  available_from: string | null;
  furnishing_type?: string;
  room_amenities: { amenity: { name: string; icon_name: string } }[];
  media: { media_url: string; media_type: string }[];
}

export interface Flat {
  id: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  furnishing_type: string;
  description?: string;
  is_published: boolean;
  user: { id: string; name: string; profile_picture_url: string | null };
  rooms: FlatRoom[];
  common_amenities: { amenity: { name: string; icon_name: string } }[];
  media: { media_url: string; media_type: string }[];
}

export const useFlats = () => {
  return useQuery<Flat[]>({
    queryKey: ["flats"],
    queryFn: async () => {
      const res = await api.get("/flats");
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
    mutationFn: async (data: {
      address: string;
      city: string;
      state: string;
      pincode?: string;
      latitude?: number;
      longitude?: number;
      furnishing_type: "furnished" | "semifurnished" | "unfurnished";
      description?: string;
      is_published?: boolean;
    }) => {
      const res = await api.post("/flats", data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["flats"] }),
  });
};
