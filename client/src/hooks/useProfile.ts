import { useQuery } from "@tanstack/react-query";
import { getProfile } from "#/api/profile";

export function useProfile() {
	return useQuery({
		queryKey: ["profile"],
		queryFn: getProfile,
		staleTime: 120_000,
	});
}
