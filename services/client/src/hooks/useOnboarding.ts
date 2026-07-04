import type { Dispatch } from "react";
import { useReducer } from "react";
import type { CvData } from "#/api/types";

export type OnboardingStep1 = {
	studyProgramId: string;
	semester: number;
	expectedGraduation: string;
};

export type OnboardingStep2 = {
	transcriptUploaded: boolean;
	cvUploaded: boolean;
	cvData: CvData | null;
};

export type OnboardingStep3 = {
	industryPreference: string;
	rolePreference: string;
	careerGoals: string[];
	interests: string[];
	preferredWorkload: number;
};

export type OnboardingState = {
	currentStep: 1 | 2 | 3;
	step1: OnboardingStep1 | null;
	step2: OnboardingStep2 | null;
	step3: OnboardingStep3 | null;
};

export type OnboardingAction =
	| { type: "SET_STEP1"; data: OnboardingStep1 }
	| { type: "UPDATE_STEP2"; data: Partial<OnboardingStep2> }
	| { type: "SET_STEP3"; data: OnboardingStep3 }
	| { type: "NEXT_STEP" }
	| { type: "PREV_STEP" }
	| { type: "RESET" };

const initialState: OnboardingState = {
	currentStep: 1,
	step1: null,
	step2: null,
	step3: null,
};

function reducer(
	state: OnboardingState,
	action: OnboardingAction,
): OnboardingState {
	switch (action.type) {
		case "SET_STEP1":
			return { ...state, step1: action.data };
		case "UPDATE_STEP2":
			return {
				...state,
				step2: {
					transcriptUploaded: false,
					cvUploaded: false,
					cvData: null,
					...state.step2,
					...action.data,
				},
			};
		case "SET_STEP3":
			return { ...state, step3: action.data };
		case "NEXT_STEP":
			return {
				...state,
				currentStep: Math.min(3, state.currentStep + 1) as 1 | 2 | 3,
			};
		case "PREV_STEP":
			return {
				...state,
				currentStep: Math.max(1, state.currentStep - 1) as 1 | 2 | 3,
			};
		case "RESET":
			return initialState;
		default:
			return state;
	}
}

const STORAGE_KEY = "onboarding-state";

function loadState(): OnboardingState {
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (raw) return JSON.parse(raw) as OnboardingState;
	} catch {
		/* ignore */
	}
	return initialState;
}

function saveState(state: OnboardingState) {
	try {
		if (state.currentStep === 1 && !state.step1) {
			sessionStorage.removeItem(STORAGE_KEY);
		} else {
			const toSave: OnboardingState = state.step2
				? { ...state, step2: { ...state.step2, cvData: null } }
				: state;
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
		}
	} catch {
		/* ignore */
	}
}

function persistingReducer(
	state: OnboardingState,
	action: OnboardingAction,
): OnboardingState {
	const next = reducer(state, action);
	saveState(next);
	return next;
}

export function useOnboarding(): [OnboardingState, Dispatch<OnboardingAction>] {
	return useReducer(persistingReducer, undefined, loadState);
}
