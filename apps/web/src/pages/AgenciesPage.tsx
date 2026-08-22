import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { getAgencyMutationErrorMessage } from "../features/agencies/agency-errors";
import {
  useCreateAgencyMutation,
  useUpdateAgencyMutation,
} from "../features/agencies/api/agency.mutations";
import { agencyListQueryOptions } from "../features/agencies/api/agency.queries";
import {
  AgencyForm,
  type AgencyFormValues,
} from "../features/agencies/components/AgencyForm";
import { AgencyList } from "../features/agencies/components/AgencyList";
import type {
  Agency,
  CreateAgencyInput,
  UpdateAgencyInput,
} from "../features/agencies/types";
import { EmptyState } from "../shared/components/EmptyState";
import { ErrorState } from "../shared/components/ErrorState";
import { LoadingState } from "../shared/components/LoadingState";
import { PageHeader } from "../shared/components/PageHeader";

export function AgenciesPage() {
  const agenciesQuery = useQuery(agencyListQueryOptions());
  const createMutation = useCreateAgencyMutation();
  const editMutation = useUpdateAgencyMutation();
  const statusMutation = useUpdateAgencyMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency>();
  const [statusAgencyId, setStatusAgencyId] = useState<string>();
  const [feedback, setFeedback] = useState<string>();
  const writeLock = useRef(false);

  const isAgencyWritePending =
    createMutation.isPending ||
    editMutation.isPending ||
    statusMutation.isPending;

  const openCreateForm = () => {
    if (writeLock.current || isAgencyWritePending) return;
    createMutation.reset();
    statusMutation.reset();
    setEditingAgency(undefined);
    setIsCreateOpen(true);
    setFeedback(undefined);
  };

  const openEditForm = (agency: Agency) => {
    if (writeLock.current || isAgencyWritePending) return;
    editMutation.reset();
    statusMutation.reset();
    setIsCreateOpen(false);
    setEditingAgency(agency);
    setFeedback(undefined);
  };

  const submitCreate = async (values: AgencyFormValues) => {
    if (writeLock.current) return;

    const normalizedNotes = values.notes.trim();
    const input: CreateAgencyInput = {
      name: values.name.trim(),
      ...(normalizedNotes ? { notes: normalizedNotes } : {}),
    };

    writeLock.current = true;
    try {
      const agency = await createMutation.mutateAsync(input);
      setIsCreateOpen(false);
      setFeedback(`L’agence « ${agency.name} » a été créée.`);
    } catch {
      // TanStack Query conserve l'erreur pour le rendu du formulaire.
    } finally {
      writeLock.current = false;
    }
  };

  const submitEdit = async (
    values: AgencyFormValues,
    dirtyFields: Partial<Record<keyof AgencyFormValues, boolean>>,
  ) => {
    if (!editingAgency || writeLock.current) return;

    const input: UpdateAgencyInput = {
      ...(dirtyFields.name ? { name: values.name.trim() } : {}),
      ...(dirtyFields.notes ? { notes: values.notes.trim() || null } : {}),
    };

    writeLock.current = true;
    try {
      const agency = await editMutation.mutateAsync({
        id: editingAgency.id,
        input,
      });
      setEditingAgency(undefined);
      setFeedback(`L’agence « ${agency.name} » a été modifiée.`);
    } catch {
      // TanStack Query conserve l'erreur pour le rendu du formulaire.
    } finally {
      writeLock.current = false;
    }
  };

  const toggleAgencyStatus = async (agency: Agency) => {
    if (writeLock.current || isAgencyWritePending) return;
    writeLock.current = true;

    statusMutation.reset();
    setStatusAgencyId(agency.id);
    setFeedback(undefined);

    try {
      const updatedAgency = await statusMutation.mutateAsync({
        id: agency.id,
        input: { isActive: !agency.isActive },
      });
      setFeedback(
        `L’agence « ${updatedAgency.name} » est maintenant ${updatedAgency.isActive ? "active" : "inactive"}.`,
      );
    } catch {
      // TanStack Query conserve l'erreur pour le rendu de la page.
    } finally {
      setStatusAgencyId(undefined);
      writeLock.current = false;
    }
  };

  return (
    <>
      <PageHeader title="Agences">
        <p>Consultez et gérez les agences liées à votre activité.</p>
        {!isCreateOpen ? (
          <button
            className="button"
            disabled={isAgencyWritePending}
            onClick={openCreateForm}
            type="button"
          >
            Ajouter une agence
          </button>
        ) : null}
      </PageHeader>

      {feedback ? (
        <div className="state-panel" role="status">
          <p>{feedback}</p>
        </div>
      ) : null}

      {statusMutation.isError ? (
        <section className="state-panel state-panel--error" role="alert">
          <h2>Impossible de modifier l’état de l’agence</h2>
          <p>{getAgencyMutationErrorMessage(statusMutation.error)}</p>
        </section>
      ) : null}

      {isCreateOpen ? (
        <section className="state-panel" aria-labelledby="create-agency-title">
          <h2 id="create-agency-title">Nouvelle agence</h2>
          <AgencyForm
            errorMessage={
              createMutation.isError
                ? getAgencyMutationErrorMessage(createMutation.error)
                : undefined
            }
            isSubmitting={createMutation.isPending}
            onCancel={() => {
              if (writeLock.current) return;
              createMutation.reset();
              setIsCreateOpen(false);
            }}
            onSubmit={submitCreate}
          />
        </section>
      ) : null}

      {editingAgency ? (
        <section className="state-panel" aria-labelledby="edit-agency-title">
          <h2 id="edit-agency-title">Modifier {editingAgency.name}</h2>
          <AgencyForm
            key={editingAgency.id}
            agency={editingAgency}
            errorMessage={
              editMutation.isError
                ? getAgencyMutationErrorMessage(editMutation.error)
                : undefined
            }
            isSubmitting={editMutation.isPending}
            onCancel={() => {
              if (writeLock.current) return;
              editMutation.reset();
              setEditingAgency(undefined);
            }}
            onSubmit={submitEdit}
          />
        </section>
      ) : null}

      {agenciesQuery.isPending ? (
        <LoadingState message="Chargement des agences…" />
      ) : null}
      {agenciesQuery.isError ? (
        <ErrorState
          error={agenciesQuery.error}
          onRetry={() => void agenciesQuery.refetch()}
          title="Impossible de charger les agences"
        />
      ) : null}
      {agenciesQuery.isSuccess && agenciesQuery.data.length === 0 ? (
        <EmptyState
          message="Les agences apparaîtront ici lorsqu’elles seront disponibles."
          title="Aucune agence"
        />
      ) : null}
      {agenciesQuery.isSuccess && agenciesQuery.data.length > 0 ? (
        <AgencyList
          agencies={agenciesQuery.data}
          isWritePending={isAgencyWritePending}
          onEdit={openEditForm}
          onToggleStatus={(agency) => void toggleAgencyStatus(agency)}
          {...(statusAgencyId === undefined
            ? {}
            : { pendingStatusAgencyId: statusAgencyId })}
        />
      ) : null}
    </>
  );
}
