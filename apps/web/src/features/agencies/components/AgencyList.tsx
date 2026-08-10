import type { Agency } from "../types";
import styles from "./AgencyList.module.css";

interface AgencyListProps {
  agencies: Agency[];
}

export function AgencyList({ agencies }: AgencyListProps) {
  return (
    <ul className={styles.list}>
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
        </li>
      ))}
    </ul>
  );
}
