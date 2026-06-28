import { useQuery } from "@tanstack/react-query";
import { getDepartments } from "#/api/catalog";

export function useDepartments() {
	return useQuery({
		queryKey: ["departments"],
		queryFn: getDepartments,
		staleTime: 600_000,
	});
}
