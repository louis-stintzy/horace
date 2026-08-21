import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { Agency } from "../types";
import styles from "./AgencyForm.module.css";

const agencyFormSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "Le nom est requis.")
    .max(100, "Le nom ne peut pas dépasser 100 caractères."),
  notes: z
    .string()
    .max(2_000, "Les notes ne peuvent pas dépasser 2 000 caractères."),
});

export type AgencyFormValues = z.infer<typeof agencyFormSchema>;

interface AgencyFormProps {
  agency?: Agency;
  errorMessage?: string | undefined;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (
    values: AgencyFormValues,
    dirtyFields: Partial<Record<keyof AgencyFormValues, boolean>>,
  ) => Promise<void>;
}

export function AgencyForm({
  agency,
  errorMessage,
  isSubmitting,
  onCancel,
  onSubmit,
}: AgencyFormProps) {
  const {
    formState: { dirtyFields, errors, isDirty },
    handleSubmit,
    register,
  } = useForm<AgencyFormValues>({
    resolver: zodResolver(agencyFormSchema),
    defaultValues: {
      name: agency?.name ?? "",
      notes: agency?.notes ?? "",
    },
  });

  const isEditing = agency !== undefined;

  const formSuffix = isEditing ? agency.id : "new";

  const nameId = `agency-name-${formSuffix}`;
  const nameErrorId = `${nameId}-error`;

  const notesId = `agency-notes-${formSuffix}`;
  const notesErrorId = `${notesId}-error`;

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        void handleSubmit((values) => onSubmit(values, dirtyFields))(event);
      }}
    >
      <div className={styles.field}>
        <label htmlFor={nameId}>Nom</label>
        <input
          aria-describedby={errors.name ? nameErrorId : undefined}
          aria-invalid={errors.name ? "true" : "false"}
          autoComplete="organization"
          id={nameId}
          maxLength={100}
          {...register("name")}
        />
        {errors.name ? (
          <p className={styles.error} id={nameErrorId}>
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor={notesId}>
          Notes <span>(facultatif)</span>
        </label>

        <textarea
          aria-describedby={errors.notes ? notesErrorId : undefined}
          aria-invalid={errors.notes ? "true" : "false"}
          id={notesId}
          maxLength={2_000}
          rows={4}
          {...register("notes")}
        />

        {errors.notes ? (
          <p className={styles.error} id={notesErrorId}>
            {errors.notes.message}
          </p>
        ) : null}
      </div>

      {errorMessage ? (
        <p className={styles.submitError} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button
          className="button"
          disabled={isSubmitting || (isEditing && !isDirty)}
          type="submit"
        >
          {isSubmitting
            ? "Enregistrement…"
            : isEditing
              ? "Enregistrer les modifications"
              : "Créer l’agence"}
        </button>
        <button
          className={styles.secondaryButton}
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
