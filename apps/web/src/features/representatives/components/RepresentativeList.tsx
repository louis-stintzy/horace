import type { Representative } from "../types";
import styles from "./RepresentativeList.module.css";

interface RepresentativeListProps {
  representatives: Representative[];
  isWritePending: boolean;
  onEdit: (representative: Representative) => void;
}

export function RepresentativeList({
  representatives,
  isWritePending,
  onEdit,
}: RepresentativeListProps) {
  return (
    <ul aria-label="Liste des représentants" className={styles.list}>
      {representatives.map((representative) => (
        <li className={styles.card} key={representative.id}>
          <h2>
            {representative.firstName} {representative.lastName}
          </h2>
          {representative.email || representative.phone ? (
            <dl className={styles.contact}>
              {representative.email ? (
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${representative.email}`}>
                      {representative.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              {representative.phone ? (
                <div>
                  <dt>Téléphone</dt>
                  <dd>
                    <a href={`tel:${representative.phone}`}>
                      {representative.phone}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
          {representative.notes ? (
            <p className={styles.notes}>{representative.notes}</p>
          ) : null}
          <button
            className={styles.editButton}
            disabled={isWritePending}
            onClick={() => onEdit(representative)}
            type="button"
          >
            Modifier
          </button>
        </li>
      ))}
    </ul>
  );
}
