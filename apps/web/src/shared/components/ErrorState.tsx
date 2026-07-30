import { ApiError } from "../api/api-error";

interface ErrorStateProps {
  error: unknown;
  onRetry: () => void;
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.isNetworkError
      ? "L’API est injoignable. Vérifiez qu’elle est démarrée."
      : error.message;
  }

  return "Une erreur inattendue est survenue.";
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <section className="state-panel state-panel--error" role="alert">
      <h2>Impossible de charger les données</h2>
      <p>{errorMessage(error)}</p>
      <button className="button" onClick={onRetry} type="button">
        Réessayer
      </button>
    </section>
  );
}
