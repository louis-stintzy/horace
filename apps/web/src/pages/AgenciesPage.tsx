import { useQuery } from "@tanstack/react-query";

import { agencyListQueryOptions } from "../features/agencies/api/agency.queries";
import { AgencyList } from "../features/agencies/components/AgencyList";
import { EmptyState } from "../shared/components/EmptyState";
import { ErrorState } from "../shared/components/ErrorState";
import { LoadingState } from "../shared/components/LoadingState";
import { PageHeader } from "../shared/components/PageHeader";

export function AgenciesPage() {
  const agenciesQuery = useQuery(agencyListQueryOptions());

  return (
    <>
      <PageHeader title="Agences">
        <p>Consultez les agences liées à votre activité.</p>
      </PageHeader>

      {agenciesQuery.isPending ? (
        <LoadingState message="Chargement des agences…" />
      ) : null}
      {agenciesQuery.isError ? (
        <ErrorState
          error={agenciesQuery.error}
          onRetry={() => void agenciesQuery.refetch()}
        />
      ) : null}
      {agenciesQuery.isSuccess && agenciesQuery.data.length === 0 ? (
        <EmptyState
          message="Les agences apparaîtront ici lorsqu’elles seront disponibles."
          title="Aucune agence"
        />
      ) : null}
      {agenciesQuery.isSuccess && agenciesQuery.data.length > 0 ? (
        <AgencyList agencies={agenciesQuery.data} />
      ) : null}
    </>
  );
}
