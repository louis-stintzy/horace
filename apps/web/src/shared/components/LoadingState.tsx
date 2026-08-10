interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = "Chargement en cours…",
}: LoadingStateProps) {
  return (
    <div className="state-panel" role="status">
      <span aria-hidden="true" className="spinner" />
      <p>{message}</p>
    </div>
  );
}
