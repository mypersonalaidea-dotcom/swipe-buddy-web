import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { UserProfile } from "./useProfile";
import { useToast } from "@/hooks/use-toast";

export interface SavedProfileResponse {
  isSaved: boolean;
  message: string;
}

export const useSavedProfiles = () => {
  return useQuery<UserProfile[]>({
    queryKey: ["social", "saved-profiles"],
    queryFn: async () => {
      const res = await api.get("/social/saved-profiles");
      return res.data.data;
    },
  });
};

export const useSaveProfile = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const res = await api.post("/social/save-profile", { targetUserId });
      return res.data as SavedProfileResponse;
    },
    onSuccess: (data, targetUserId) => {
      // Invalidate both saved profiles list and any specific profile query
      qc.invalidateQueries({ queryKey: ["social", "saved-profiles"] });
      // If we have a query for this specific profile, invalidate it too
      qc.invalidateQueries({ queryKey: ["profile", targetUserId] });
      
      toast({
        title: data.isSaved ? "Profile Saved" : "Profile Removed",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });
};
