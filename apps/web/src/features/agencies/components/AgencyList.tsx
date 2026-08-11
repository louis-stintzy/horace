import type { Agency } from "../types";
import styles from "./AgencyList.module.css";

interface AgencyListProps {
  agencies: Agency[];
  pendingStatusAgencyId?: string;
  onEdit: (agency: Agency) => void;
  onToggleStatus: (agency: Agency) => void;
}

export function AgencyList({
  agencies,
  pendingStatusAgencyId,
  onEdit,
  onToggleStatus,
}: AgencyListProps) {
  return (
    <ul aria-label="Liste des agences" className={styles.list}>
      {agencies.map((agency) => (
        <li className={styles.card} key={agency.id}>
          <div className={styles.heading}>
            <h2>{agency.name}</h2>
            <span
              className={agency.isActive ? styles.active : styles.inactive}
            >
              {agency.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {agency.notes ? <p className={styles.notes}>{agency.notes}</p> : null}
          <div className={styles.actions}>
            <button
              className={styles.secondaryButton}
              disabled={pendingStatusAgencyId === agency.id}
              onClick={() => onEdit(agency)}
              type="button"
            >
              Modifier
            </button>
            <button
              className={styles.statusButton}
              disabled={pendingStatusAgencyId !== undefined}
              onClick={() => onToggleStatus(agency)}
              type="button"
            >
              {pendingStatusAgencyId === agency.id
                ? "Mise à jour…"
                : agency.isActive
                  ? "Désactiver"
                  : "Activer"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
