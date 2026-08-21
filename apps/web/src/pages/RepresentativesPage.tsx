import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { getRepresentativeErrorMessage } from "../features/representatives/representative-errors";
import {
  useCreateRepresentativeMutation,
  useUpdateRepresentativeMutation,
} from "../features/representatives/api/representative.mutations";
import { representativeListQueryOptions } from "../features/representatives/api/representative.queries";
import {
  RepresentativeForm,
  type RepresentativeFormValues,
} from "../features/representatives/components/RepresentativeForm";
import { RepresentativeList } from "../features/representatives/components/RepresentativeList";
import type {
  CreateRepresentativeInput,
  Representative,
  UpdateRepresentativeInput,
} from "../features/representatives/types";
import { EmptyState } from "../shared/components/EmptyState";
import { ErrorState } from "../shared/components/ErrorState";
import { LoadingState } from "../shared/components/LoadingState";
import { PageHeader } from "../shared/components/PageHeader";

function optionalCreateValue(value: string): string | undefined {
  const normalizedValue = value.trim();
  return normalizedValue || undefined;
}

function nullableUpdateValue(value: string): string | null {
  return value.trim() || null;
}

export function RepresentativesPage() {
  const representativesQuery = useQuery(representativeListQueryOptions());
  const createMutation = useCreateRepresentativeMutation();
  const updateMutation = useUpdateRepresentativeMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRepresentative, setEditingRepresentative] =
    useState<Representative>();
  const [feedback, setFeedback] = useState<string>();
  const writeLock = useRef(false);

  const isWritePending = createMutation.isPending || updateMutation.isPending;

  const openCreateForm = () => {
    if (writeLock.current || isWritePending) return;
    createMutation.reset();
    updateMutation.reset();
    setEditingRepresentative(undefined);
    setIsCreateOpen(true);
    setFeedback(undefined);
  };

  const openEditForm = (representative: Representative) => {
    if (writeLock.current || isWritePending) return;
    createMutation.reset();
    updateMutation.reset();
    setIsCreateOpen(false);
    setEditingRepresentative(representative);
    setFeedback(undefined);
  };

  const submitCreate = async (values: RepresentativeFormValues) => {
    if (writeLock.current) return;

    const email = optionalCreateValue(values.email);
    const phone = optionalCreateValue(values.phone);
    const notes = optionalCreateValue(values.notes);
    const input: CreateRepresentativeInput = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      ...(email === undefined ? {} : { email }),
      ...(phone === undefined ? {} : { phone }),
      ...(notes === undefined ? {} : { notes }),
    };

    writeLock.current = true;
    try {
      const representative = await createMutation.mutateAsync(input);
      setIsCreateOpen(false);
      setFeedback(
        `${representative.firstName} ${representative.lastName} a été ajouté.`,
      );
    } catch {
      // TanStack Query conserve l'erreur pour le rendu du formulaire.
    } finally {
      writeLock.current = false;
    }
  };

  const submitEdit = async (
    values: RepresentativeFormValues,
    dirtyFields: Partial<Record<keyof RepresentativeFormValues, boolean>>,
  ) => {
    if (!editingRepresentative || writeLock.current) return;

    const input: UpdateRepresentativeInput = {
      ...(dirtyFields.firstName
        ? { firstName: values.firstName.trim() }
        : {}),
      ...(dirtyFields.lastName ? { lastName: values.lastName.trim() } : {}),
      ...(dirtyFields.email ? { email: nullableUpdateValue(values.email) } : {}),
      ...(dirtyFields.phone ? { phone: nullableUpdateValue(values.phone) } : {}),
      ...(dirtyFields.notes ? { notes: nullableUpdateValue(values.notes) } : {}),
    };

    if (Object.keys(input).length === 0) return;

    writeLock.current = true;
    try {
      const representative = await updateMutation.mutateAsync({
        id: editingRepresentative.id,
        input,
      });
      setEditingRepresentative(undefined);
      setFeedback(
        `${representative.firstName} ${representative.lastName} a été modifié.`,
      );
    } catch {
      // TanStack Query conserve l'erreur pour le rendu du formulaire.
    } finally {
      writeLock.current = false;
    }
  };

  return (
    <>
      <PageHeader title="Représentants">
        <p>Consultez et gérez les représentants de vos élèves.</p>
        {!isCreateOpen ? (
          <button
            className="button"
            disabled={isWritePending}
            onClick={openCreateForm}
            type="button"
          >
            Ajouter un représentant
          </button>
        ) : null}
      </PageHeader>

      {feedback ? (
        <div className="state-panel" role="status">
          <p>{feedback}</p>
        </div>
      ) : null}

      {isCreateOpen ? (
        <section
          aria-labelledby="create-representative-title"
          className="state-panel"
        >
          <h2 id="create-representative-title">Nouveau représentant</h2>
          <RepresentativeForm
            errorMessage={
              createMutation.isError
                ? getRepresentativeErrorMessage(createMutation.error)
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

      {editingRepresentative ? (
        <section
          aria-labelledby="edit-representative-title"
          className="state-panel"
        >
          <h2 id="edit-representative-title">
            Modifier {editingRepresentative.firstName}{" "}
            {editingRepresentative.lastName}
          </h2>
          <RepresentativeForm
            key={editingRepresentative.id}
            representative={editingRepresentative}
            errorMessage={
              updateMutation.isError
                ? getRepresentativeErrorMessage(updateMutation.error)
                : undefined
            }
            isSubmitting={updateMutation.isPending}
            onCancel={() => {
              if (writeLock.current) return;
              updateMutation.reset();
              setEditingRepresentative(undefined);
            }}
            onSubmit={submitEdit}
          />
        </section>
      ) : null}

      {representativesQuery.isPending ? (
        <LoadingState message="Chargement des représentants…" />
      ) : null}
      {representativesQuery.isError ? (
        <ErrorState
          error={representativesQuery.error}
          onRetry={() => void representativesQuery.refetch()}
          title="Impossible de charger les représentants"
        />
      ) : null}
      {representativesQuery.isSuccess &&
      representativesQuery.data.length === 0 ? (
        <EmptyState
          message="Les représentants apparaîtront ici lorsqu’ils seront disponibles."
          title="Aucun représentant"
        />
      ) : null}
      {representativesQuery.isSuccess &&
      representativesQuery.data.length > 0 ? (
        <RepresentativeList
          isWritePending={isWritePending}
          onEdit={openEditForm}
          representatives={representativesQuery.data}
        />
      ) : null}
    </>
  );
}
