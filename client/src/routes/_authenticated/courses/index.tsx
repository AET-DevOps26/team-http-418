import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useCourses } from "#/hooks/useCourses";
import { CourseCard } from "#/components/courses/CourseCard";
import { SearchBar } from "#/components/courses/SearchBar";
import { FilterPanel } from "#/components/courses/FilterPanel";
import { CourseDetailSheet } from "#/components/courses/CourseDetailSheet";
import type { CourseSearchParams } from "#/api/types";

type SearchSchema = {
	q?: string;
	ai?: boolean;
	department?: string;
	semester?: string;
	creditsMin?: number;
	creditsMax?: number;
	language?: string;
	level?: string;
	studyProgramId?: string;
	course?: string;
};

export const Route = createFileRoute("/_authenticated/courses/")({
	validateSearch: (search: Record<string, unknown>): SearchSchema => ({
		q: typeof search.q === "string" ? search.q : undefined,
		ai: search.ai === "true" || search.ai === true,
		department: typeof search.department === "string" ? search.department : undefined,
		semester: typeof search.semester === "string" ? search.semester : undefined,
		creditsMin: search.creditsMin ? Number(search.creditsMin) : undefined,
		creditsMax: search.creditsMax ? Number(search.creditsMax) : undefined,
		language: typeof search.language === "string" ? search.language : undefined,
		level: typeof search.level === "string" ? search.level : undefined,
		studyProgramId: typeof search.studyProgramId === "string" ? search.studyProgramId : undefined,
		course: typeof search.course === "string" ? search.course : undefined,
	}),
	component: CoursesPage,
});

function SkeletonCard() {
	return (
		<div className="card catalog-course-card-skel" style={{ padding: 18 }}>
			<div className="skel" style={{ height: 12, width: 80, marginBottom: 10 }} />
			<div className="skel" style={{ height: 16, width: "80%", marginBottom: 8 }} />
			<div className="skel" style={{ height: 11, width: "50%" }} />
		</div>
	);
}

function CoursesPage() {
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	const params: Omit<CourseSearchParams, "page" | "size"> = {
		search: search.q || undefined,
		ai: search.ai || undefined,
		department: search.department,
		semester: search.semester,
		creditsMin: search.creditsMin,
		creditsMax: search.creditsMax,
		language: search.language,
		level: search.level,
		studyProgramId: search.studyProgramId,
	};

	const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useCourses(params);

	const loadMoreRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!loadMoreRef.current || !hasNextPage) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
			},
			{ threshold: 0.1 },
		);
		observer.observe(loadMoreRef.current);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	function setSearch(patch: Partial<SearchSchema>) {
		navigate({ search: (prev) => ({ ...prev, ...patch }) });
	}

	const allCourses = data?.pages.flatMap((p) => p.content) ?? [];
	const isEmpty = !isLoading && !isError && allCourses.length === 0;

	return (
		<div className="view-fade" style={{ padding: "28px 28px 40px" }}>
			<div style={{ marginBottom: 20 }}>
				<h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
					Course Catalog
				</h1>
				<p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--muted)" }}>
					Browse and search all available courses
				</p>
			</div>

			<SearchBar
				value={search.q ?? ""}
				ai={search.ai ?? false}
				onChange={(q) => setSearch({ q: q || undefined })}
				onAiToggle={(ai) => setSearch({ ai: ai || undefined })}
			/>

			<FilterPanel
				filters={{
					department: search.department,
					studyProgramId: search.studyProgramId,
					language: search.language,
					level: search.level,
					creditsMin: search.creditsMin,
					creditsMax: search.creditsMax,
					semester: search.semester,
				}}
				onChange={(f) =>
					setSearch({
						department: f.department,
						studyProgramId: f.studyProgramId,
						language: f.language,
						level: f.level,
						creditsMin: f.creditsMin,
						creditsMax: f.creditsMax,
						semester: f.semester,
					})
				}
			/>

			{isError && (
				<div style={{ textAlign: "center", marginTop: 48 }}>
					<p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>
						Failed to load courses.
					</p>
					<button type="button" className="btn btn-primary" onClick={() => refetch()}>
						Try again
					</button>
				</div>
			)}

			{isEmpty && (
				<div style={{ textAlign: "center", marginTop: 48 }}>
					<p style={{ color: "var(--muted)", fontSize: 14 }}>No courses found.</p>
				</div>
			)}

			<div className="catalog-grid">
				{isLoading
					? (["1","2","3","4","5","6","7","8","9","10","11","12"] as const).map((k) => <SkeletonCard key={k} />)
					: allCourses.map((c) => (
							<CourseCard
								key={c.id}
								course={c}
								onClick={(id) => setSearch({ course: id })}
							/>
						))}
			</div>

			{!isLoading && hasNextPage && (
				<div ref={loadMoreRef} style={{ marginTop: 24, textAlign: "center" }}>
					<button
						type="button"
						className="btn btn-ghost"
						onClick={() => fetchNextPage()}
						disabled={isFetchingNextPage}
					>
						{isFetchingNextPage ? "Loading…" : "Load more"}
					</button>
				</div>
			)}

			{search.course && (
				<CourseDetailSheet
					courseId={search.course}
					onClose={() => setSearch({ course: undefined })}
				/>
			)}
		</div>
	);
}
