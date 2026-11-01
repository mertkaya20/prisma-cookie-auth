import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "./api";
import { queryKeys } from "./query-keys";
import type { User } from "./types";

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api<{ user: User }>("/auth/me"),
  });
}

// Ziyaretçiye kendi demo organizasyonunu açar ve login gibi /app'e götürür.
export function useTryDemo() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api<{ user: User }>("/auth/demo", { method: "POST" }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.me, data);
      router.push("/app");
    },
  });
}

// Render boşta kalınca uyuyor; ilk istek onu uyandırana kadar bekler.
export const DEMO_NOTE =
  "No sign-up needed. You get a sample team to explore for 24 hours.";
export const DEMO_WAKING_NOTE =
  "Setting up your team. If the server was asleep, this can take up to a minute.";
