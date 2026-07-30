import { Link } from "react-router-dom";

import { PageHeader } from "../shared/components/PageHeader";

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page introuvable" />
      <div className="state-panel">
        <p>La page demandée n’existe pas.</p>
        <Link className="button" to="/">
          Revenir à l’accueil
        </Link>
      </div>
    </>
  );
}
