import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CourseSearchParams } from "#/api/types";
import { CourseCard } from "#/components/courses/CourseCard";
import { CourseDetailSheet } from "#/components/courses/CourseDetailSheet";
import { FilterPanel } from "#/components/courses/FilterPanel";
import { SearchBar } from "#/components/courses/SearchBar";
import { GenerateForm } from "#/components/recommendations/GenerateForm";
import { RecommendationCard } from "#/components/recommendations/RecommendationCard";
import { RecommendationFilters } from "#/components/recommendations/RecommendationFilters";
import { useCourses } from "#/hooks/useCourses";
import {
	useGenerateRecommendations,
	useRecommendations,
} from "#/hooks/useRecommendations";

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
	view?: "catalog" | "recommended";
};

function parseSearchNumber(value: unknown): number | undefined {
	if (value === undefined || value === null || value === "") return undefined;
	const parsed = Number(value);
	return Number.isNaN(parsed) ? undefined : parsed;
}

function cleanSearch(search: SearchSchema): SearchSchema {
	return Object.fromEntries(
		Object.entries(search).filter(
			([, value]) => value !== undefined && value !== "",
		),
	) as SearchSchema;
}

export const Route = createFileRoute("/_authenticated/courses/")({
	validateSearch: (search: Record<string, unknown>): SearchSchema => ({
		q: typeof search.q === "string" ? search.q : undefined,
		ai: search.ai === "true" || search.ai === true,
		department:
			typeof search.department === "string" ? search.department : undefined,
		semester: typeof search.semester === "string" ? search.semester : undefined,
		creditsMin: parseSearchNumber(search.creditsMin),
		creditsMax: parseSearchNumber(search.creditsMax),
		language: typeof search.language === "string" ? search.language : undefined,
		level: typeof search.level === "string" ? search.level : undefined,
		studyProgramId:
			typeof search.studyProgramId === "string"
				? search.studyProgramId
				: undefined,
		course: typeof search.course === "string" ? search.course : undefined,
		view:
			search.view === "recommended" || search.view === "catalog"
				? search.view
				: undefined,
	}),
	component: CoursesPage,
});

function SkeletonCard() {
	return (
		<div className="card catalog-course-card-skel" style={{ padding: 18 }}>
			<div
				className="skel"
				style={{ height: 12, width: 80, marginBottom: 10 }}
			/>
			<div
				className="skel"
				style={{ height: 16, width: "80%", marginBottom: 8 }}
			/>
			<div className="skel" style={{ height: 11, width: "50%" }} />
		</div>
	);
}

function ForYouView() {
	const [showForm, setShowForm] = useState(false);
	const [filters, setFilters] = useState({ category: "", semester: "" });

	const params = {
		...(filters.category ? { category: filters.category } : {}),
		...(filters.semester ? { semester: filters.semester } : {}),
	};

	const { data, isLoading, isError, refetch } = useRecommendations(
		Object.keys(params).length > 0 ? params : undefined,
	);
	const mutation = useGenerateRecommendations();

	if (isLoading) {
		return (
			<div className="rec-grid">
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<div key={i} className="card" style={{ padding: 16, minHeight: 200 }}>
						<div
							className="skel"
							style={{ height: 16, width: 70, marginBottom: 8 }}
						/>
						<div
							className="skel"
							style={{ height: 14, width: "80%", marginBottom: 12 }}
						/>
						<div
							className="skel"
							style={{ height: 5, width: "100%", marginBottom: 16 }}
						/>
						<div
							className="skel"
							style={{ height: 60, width: "100%", marginBottom: 12 }}
						/>
					</div>
				))}
			</div>
		);
	}

	if (isError || !data) {
		return (
			<div style={{ textAlign: "center", marginTop: 48 }}>
				<p style={{ color: "var(--muted)", marginBottom: 12, fontSize: 14 }}>
					Failed to load recommendations.
				</p>
				<button
					type="button"
					className="btn btn-primary"
					onClick={() => refetch()}
				>
					Try again
				</button>
			</div>
		);
	}

	return (
		<div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: 16,
				}}
			>
				<p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
					Personalised suggestions based on your degree progress and goals
				</p>
				<button
					type="button"
					className="btn btn-ghost"
					style={{ flexShrink: 0 }}
					onClick={() => setShowForm((v) => !v)}
				>
					<Sparkles size={14} strokeWidth={2} />
					{showForm ? "Hide form" : "Refresh with context"}
				</button>
			</div>

			{showForm && <GenerateForm mutation={mutation} />}

			<RecommendationFilters filters={filters} onChange={setFilters} />

			{data.recommendations.length === 0 ? (
				<div
					style={{
						textAlign: "center",
						padding: "60px 0",
						color: "var(--muted)",
						fontSize: 14,
					}}
				>
					No recommendations match your current filters.
				</div>
			) : (
				<div className="rec-grid">
					{data.recommendations.map((rec) => (
						<RecommendationCard key={rec.courseId} recommendation={rec} />
					))}
				</div>
			)}
		</div>
	);
}

function CoursesPage() {
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	const view = search.view ?? "recommended";

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

	const {
		data,
		isLoading,
		isError,
		refetch,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useCourses(params);

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
		navigate({ search: (prev) => cleanSearch({ ...prev, ...patch }) });
	}

	const allCourses = data?.pages.flatMap((p) => p.content) ?? [];
	const isEmpty = !isLoading && !isError && allCourses.length === 0;

	return (
		<div className="view-fade" style={{ padding: "28px 28px 40px" }}>
			<div style={{ marginBottom: 20 }}>
				<h1
					style={{
						margin: 0,
						fontSize: 22,
						fontWeight: 700,
						color: "var(--ink)",
					}}
				>
					Courses
				</h1>
			</div>

			<div
				style={{
					display: "flex",
					gap: 4,
					marginBottom: 24,
					background: "var(--surface-2, #f4f4f5)",
					borderRadius: "var(--r-md, 8px)",
					padding: 4,
					width: "fit-content",
				}}
			>
				{(
					[
						{ key: "recommended", label: "For You" },
						{ key: "catalog", label: "All Courses" },
					] as const
				).map(({ key, label }) => (
					<button
						key={key}
						type="button"
						onClick={() =>
							setSearch({ view: key })
						}
						style={{
							padding: "6px 16px",
							borderRadius: "var(--r-sm, 6px)",
							border: "none",
							cursor: "pointer",
							fontSize: 13,
							fontWeight: 600,
							background: view === key ? "var(--surface, #fff)" : "transparent",
							color: view === key ? "var(--ink)" : "var(--muted)",
							boxShadow: view === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
							transition: "all 0.15s",
						}}
					>
						{label}
					</button>
				))}
			</div>

			{view === "recommended" ? (
				<ForYouView />
			) : (
				<>
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
							<p
								style={{
									color: "var(--muted)",
									fontSize: 14,
									marginBottom: 12,
								}}
							>
								Failed to load courses.
							</p>
							<button
								type="button"
								className="btn btn-primary"
								onClick={() => refetch()}
							>
								Try again
							</button>
						</div>
					)}

					{isEmpty && (
						<div style={{ textAlign: "center", marginTop: 48 }}>
							<p style={{ color: "var(--muted)", fontSize: 14 }}>
								No courses found.
							</p>
						</div>
					)}

					<div className="catalog-grid">
						{isLoading
							? (
									[
										"1",
										"2",
										"3",
										"4",
										"5",
										"6",
										"7",
										"8",
										"9",
										"10",
										"11",
										"12",
									] as const
								).map((k) => <SkeletonCard key={k} />)
							: allCourses.map((c) => (
									<CourseCard
										key={c?.id ?? "N/A"}
										course={c}
										onClick={(id) => setSearch({ course: id })}
									/>
								))}
					</div>

					{!isLoading && hasNextPage && (
						<div
							ref={loadMoreRef}
							style={{ marginTop: 24, textAlign: "center" }}
						>
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
				</>
			)}
		</div>
	);
}
