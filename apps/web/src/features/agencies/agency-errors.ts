import { ApiError } from "../../shared/api/api-error";

export function getAgencyMutationErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Une erreur inattendue est survenue.";
  }

  if (error.isNetworkError) {
    return "L’API est injoignable. Vérifiez qu’elle est démarrée.";
  }

  switch (error.code) {
    case "AGENCY_NAME_CONFLICT":
      return "Une agence porte déjà ce nom.";
    case "AGENCY_HAS_PLANNED_LESSONS":
      return "Terminez ou annulez les cours planifiés de cette agence avant de la désactiver.";
    case "AGENCY_NOT_FOUND":
      return "Cette agence n’existe plus ou n’est plus accessible.";
    case "VALIDATION_ERROR":
      return "Certaines informations sont invalides. Vérifiez le formulaire.";
    default:
      return error.message;
  }
}
