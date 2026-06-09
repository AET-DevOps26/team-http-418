export type ProblemDetail = {
	type: string;
	title: string;
	status: number;
	detail?: string;
	instance?: string;
	[key: string]: unknown;
};

export type Page<T> = {
	content: T[];
	totalElements: number;
	totalPages: number;
	number: number;
	size: number;
	first: boolean;
	last: boolean;
	empty: boolean;
};

export type IsoDateString = string & { readonly __brand: "IsoDateString" };
export type SemesterKey = string & { readonly __brand: "SemesterKey" };
