import { ApiError } from "../../shared/api/api-error";

export function getRepresentativeErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Une erreur inattendue est survenue.";
  }

  if (error.isNetworkError) {
    return "L’API est injoignable. Vérifiez qu’elle est démarrée.";
  }

  switch (error.code) {
    case "REPRESENTATIVE_NOT_FOUND":
      return "Ce représentant n’existe plus ou n’est plus accessible.";
    case "VALIDATION_ERROR":
      return "Certaines informations sont invalides. Vérifiez le formulaire.";
    default:
      return error.message;
  }
}
