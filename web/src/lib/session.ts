import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { queryKeys } from "./query-keys";
import type { User } from "./types";

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api<{ user: User }>("/auth/me"),
  });
}
