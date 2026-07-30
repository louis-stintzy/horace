interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = "Chargement en cours…",
}: LoadingStateProps) {
  return (
    <div aria-live="polite" className="state-panel">
      <span aria-hidden="true" className="spinner" />
      <p>{message}</p>
    </div>
  );
}
