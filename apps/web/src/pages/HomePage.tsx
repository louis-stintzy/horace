import { useQuery } from "@tanstack/react-query";

import { getHealth } from "../shared/api/health.service";
import { ErrorState } from "../shared/components/ErrorState";
import { LoadingState } from "../shared/components/LoadingState";
import { PageHeader } from "../shared/components/PageHeader";

export function HomePage() {
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => getHealth({ signal }),
    retry: false,
  });

  return (
    <>
      <PageHeader title="Tableau de bord">
        <p>Planifiez vos cours et suivez votre activité.</p>
      </PageHeader>

      <section aria-labelledby="api-health-title" className="health-card">
        <h2 id="api-health-title">État du service</h2>
        {healthQuery.isPending ? (
          <LoadingState message="Vérification de l’API…" />
        ) : null}
        {healthQuery.isError ? (
          <ErrorState
            error={healthQuery.error}
            onRetry={() => void healthQuery.refetch()}
          />
        ) : null}
        {healthQuery.isSuccess ? (
          <p className="health-status">
            <span aria-hidden="true" className="health-status__dot" />
            API et base de données disponibles
          </p>
        ) : null}
      </section>
    </>
  );
}
