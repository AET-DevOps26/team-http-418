import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";

type ToastVariant = "success" | "error" | "info";

type Toast = {
	id: number;
	message: string;
	variant: ToastVariant;
};

type ToastCtx = {
	toast: (message: string, variant?: ToastVariant) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

let nextId = 0;

const VARIANT_STYLES: Record<ToastVariant, React.CSSProperties> = {
	success: { background: "var(--success)", color: "#fff" },
	error: { background: "var(--danger)", color: "#fff" },
	info: { background: "var(--ink)", color: "#fff" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const toast = useCallback(
		(message: string, variant: ToastVariant = "info") => {
			const id = nextId++;
			setToasts((prev) => [...prev, { id, message, variant }]);
			setTimeout(() => {
				setToasts((prev) => prev.filter((t) => t.id !== id));
			}, 4000);
		},
		[],
	);

	return (
		<Ctx.Provider value={{ toast }}>
			{children}
			<div className="toast-container">
				{toasts.map((t) => (
					<div
						key={t.id}
						className="toast-item"
						style={VARIANT_STYLES[t.variant]}
					>
						{t.message}
					</div>
				))}
			</div>
		</Ctx.Provider>
	);
}

export function useToast(): ToastCtx {
	const ctx = useContext(Ctx);
	if (!ctx) throw new Error("useToast must be used within ToastProvider");
	return ctx;
}
