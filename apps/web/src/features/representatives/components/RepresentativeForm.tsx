import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { Representative } from "../types";
import styles from "./RepresentativeForm.module.css";

const optionalEmailSchema = z
  .string()
  .trim()
  .max(254, "L’adresse email ne peut pas dépasser 254 caractères.")
  .refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "L’adresse email est invalide.",
  );

const representativeFormSchema = z.strictObject({
  firstName: z
    .string()
    .trim()
    .min(1, "Le prénom est requis.")
    .max(100, "Le prénom ne peut pas dépasser 100 caractères."),
  lastName: z
    .string()
    .trim()
    .min(1, "Le nom est requis.")
    .max(100, "Le nom ne peut pas dépasser 100 caractères."),
  email: optionalEmailSchema,
  phone: z
    .string()
    .trim()
    .max(50, "Le téléphone ne peut pas dépasser 50 caractères."),
  notes: z
    .string()
    .max(2_000, "Les notes ne peuvent pas dépasser 2 000 caractères."),
});

export type RepresentativeFormValues = z.infer<
  typeof representativeFormSchema
>;

interface RepresentativeFormProps {
  representative?: Representative;
  errorMessage?: string | undefined;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (
    values: RepresentativeFormValues,
    dirtyFields: Partial<Record<keyof RepresentativeFormValues, boolean>>,
  ) => Promise<void>;
}

interface FieldErrorProps {
  id: string;
  message?: string | undefined;
}

function FieldError({ id, message }: FieldErrorProps) {
  return message ? (
    <p className={styles.error} id={id}>
      {message}
    </p>
  ) : null;
}

export function RepresentativeForm({
  representative,
  errorMessage,
  isSubmitting,
  onCancel,
  onSubmit,
}: RepresentativeFormProps) {
  const {
    formState: { dirtyFields, errors, isDirty },
    handleSubmit,
    register,
  } = useForm<RepresentativeFormValues>({
    resolver: zodResolver(representativeFormSchema),
    defaultValues: {
      firstName: representative?.firstName ?? "",
      lastName: representative?.lastName ?? "",
      email: representative?.email ?? "",
      phone: representative?.phone ?? "",
      notes: representative?.notes ?? "",
    },
  });

  const isEditing = representative !== undefined;
  const suffix = representative?.id ?? "new";
  const fieldId = (field: keyof RepresentativeFormValues) =>
    `representative-${field}-${suffix}`;
  const errorId = (field: keyof RepresentativeFormValues) =>
    `${fieldId(field)}-error`;

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        void handleSubmit((values) => onSubmit(values, dirtyFields))(event);
      }}
    >
      <div className={styles.nameFields}>
        <div className={styles.field}>
          <label htmlFor={fieldId("firstName")}>Prénom</label>
          <input
            aria-describedby={errors.firstName ? errorId("firstName") : undefined}
            aria-invalid={errors.firstName ? "true" : "false"}
            autoComplete="given-name"
            id={fieldId("firstName")}
            maxLength={100}
            {...register("firstName")}
          />
          <FieldError
            id={errorId("firstName")}
            message={errors.firstName?.message}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={fieldId("lastName")}>Nom</label>
          <input
            aria-describedby={errors.lastName ? errorId("lastName") : undefined}
            aria-invalid={errors.lastName ? "true" : "false"}
            autoComplete="family-name"
            id={fieldId("lastName")}
            maxLength={100}
            {...register("lastName")}
          />
          <FieldError
            id={errorId("lastName")}
            message={errors.lastName?.message}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={fieldId("email")}>
          Email <span>(facultatif)</span>
        </label>
        <input
          aria-describedby={errors.email ? errorId("email") : undefined}
          aria-invalid={errors.email ? "true" : "false"}
          autoComplete="email"
          id={fieldId("email")}
          maxLength={254}
          type="email"
          {...register("email")}
        />
        <FieldError id={errorId("email")} message={errors.email?.message} />
      </div>

      <div className={styles.field}>
        <label htmlFor={fieldId("phone")}>
          Téléphone <span>(facultatif)</span>
        </label>
        <input
          aria-describedby={errors.phone ? errorId("phone") : undefined}
          aria-invalid={errors.phone ? "true" : "false"}
          autoComplete="tel"
          id={fieldId("phone")}
          maxLength={50}
          type="tel"
          {...register("phone")}
        />
        <FieldError id={errorId("phone")} message={errors.phone?.message} />
      </div>

      <div className={styles.field}>
        <label htmlFor={fieldId("notes")}>
          Notes <span>(facultatif)</span>
        </label>
        <textarea
          aria-describedby={errors.notes ? errorId("notes") : undefined}
          aria-invalid={errors.notes ? "true" : "false"}
          id={fieldId("notes")}
          maxLength={2_000}
          rows={4}
          {...register("notes")}
        />
        <FieldError id={errorId("notes")} message={errors.notes?.message} />
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
              : "Créer le représentant"}
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
