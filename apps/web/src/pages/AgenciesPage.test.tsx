import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../test/mocks/server";
import { renderApp } from "../test/render-app";

const agencies = [
  {
    id: "00000000-0000-4000-8000-000000000010",
    name: "Agence active",
    notes: "Note utile",
    isActive: true,
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000011",
    name: "Agence historique",
    notes: null,
    isActive: false,
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
  },
];

const createdAgency = {
  id: "00000000-0000-4000-8000-000000000012",
  name: "Nouvelle agence",
  notes: "Notes de création",
  isActive: true,
  createdAt: "2026-08-11T08:00:00.000Z",
  updatedAt: "2026-08-11T08:00:00.000Z",
};

function firstAgencyCard() {
  const agencyList = screen.getByRole("list", { name: "Liste des agences" });
  const firstAgency = within(agencyList).getAllByRole("listitem")[0];

  if (!firstAgency) {
    throw new Error("La liste devrait contenir au moins une agence.");
  }

  return within(firstAgency);
}

describe("page agences", () => {
  it("affiche les agences dans l’ordre de l’API", async () => {
    server.use(
      http.get("/api/v1/agencies", () => HttpResponse.json({ data: agencies })),
    );
    renderApp("/agencies");

    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings.map(({ textContent }) => textContent)).toEqual([
      "Agence active",
      "Agence historique",
    ]);
    expect(screen.getByText("Note utile")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("affiche l’état vide", async () => {
    renderApp("/agencies");

    expect(
      await screen.findByRole("heading", { name: "Aucune agence" }),
    ).toBeInTheDocument();
  });

  it("affiche une erreur HTTP structurée", async () => {
    server.use(
      http.get("/api/v1/agencies", () =>
        HttpResponse.json(
          {
            error: {
              code: "INTERNAL_SERVER_ERROR",
              message: "Service temporairement indisponible.",
            },
          },
          { status: 500 },
        ),
      ),
    );
    renderApp("/agencies");

    expect(
      await screen.findByText("Service temporairement indisponible."),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", {
        name: "Impossible de charger les agences",
      }),
    ).toBeInTheDocument();
  });

  it("affiche une erreur sans crasher pour une réponse nominale invalide", async () => {
    server.use(http.get("/api/v1/agencies", () => HttpResponse.json({})));
    renderApp("/agencies");

    expect(
      await screen.findByRole("heading", {
        name: "Impossible de charger les agences",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("L’API a renvoyé une réponse invalide."),
    ).toBeInTheDocument();
  });

  it("affiche une erreur réseau", async () => {
    server.use(http.get("/api/v1/agencies", () => HttpResponse.error()));
    renderApp("/agencies");

    expect(
      await screen.findByText(
        "L’API est injoignable. Vérifiez qu’elle est démarrée.",
      ),
    ).toBeInTheDocument();
  });

  it("relance la requête après une erreur", async () => {
    let attempts = 0;
    server.use(
      http.get("/api/v1/agencies", () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.error()
          : HttpResponse.json({ data: agencies });
      }),
    );
    const user = userEvent.setup();
    renderApp("/agencies");

    await user.click(await screen.findByRole("button", { name: "Réessayer" }));

    expect(
      await screen.findByRole("heading", { name: "Agence active" }),
    ).toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it("affiche un état de chargement accessible", async () => {
    server.use(
      http.get("/api/v1/agencies", async () => {
        await delay(100);

        return HttpResponse.json({ data: agencies });
      }),
    );

    renderApp("/agencies");

    expect(screen.getByRole("status")).toHaveTextContent(
      "Chargement des agences…",
    );

    expect(
      await screen.findByRole("heading", {
        name: "Agence active",
      }),
    ).toBeInTheDocument();
  });

  it("ouvre le formulaire de création et valide le nom", async () => {
    const user = userEvent.setup();
    renderApp("/agencies");

    await user.click(
      screen.getByRole("button", { name: "Ajouter une agence" }),
    );
    expect(
      screen.getByRole("heading", { name: "Nouvelle agence" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Créer l’agence" }));
    expect(await screen.findByText("Le nom est requis.")).toBeInTheDocument();

    const nameInput = screen.getByLabelText("Nom");
    const nameError = screen.getByText("Le nom est requis.");

    expect(nameInput).toHaveAttribute("aria-describedby", nameError.id);
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
  });

  it("crée une agence et actualise la liste", async () => {
    let currentAgencies = agencies;
    server.use(
      http.get("/api/v1/agencies", () =>
        HttpResponse.json({ data: currentAgencies }),
      ),
      http.post("/api/v1/agencies", async ({ request }) => {
        expect(await request.json()).toEqual({
          name: "Nouvelle agence",
          notes: "Notes de création",
        });
        currentAgencies = [...agencies, createdAgency];
        return HttpResponse.json({ data: createdAgency }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderApp("/agencies");

    await screen.findByRole("heading", { name: "Agence active" });
    await user.click(
      screen.getByRole("button", { name: "Ajouter une agence" }),
    );
    await user.type(screen.getByLabelText("Nom"), "Nouvelle agence");
    await user.type(screen.getByLabelText(/Notes/), "Notes de création");
    await user.click(screen.getByRole("button", { name: "Créer l’agence" }));

    expect(
      await screen.findByText("L’agence « Nouvelle agence » a été créée."),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Nouvelle agence" }),
    ).toBeInTheDocument();
  });

  it("affiche un conflit de nom lors de la création", async () => {
    server.use(
      http.post("/api/v1/agencies", () =>
        HttpResponse.json(
          {
            error: {
              code: "AGENCY_NAME_CONFLICT",
              message: "An agency with this name already exists.",
            },
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp("/agencies");

    await user.click(
      screen.getByRole("button", { name: "Ajouter une agence" }),
    );
    await user.type(screen.getByLabelText("Nom"), "Agence existante");
    await user.click(screen.getByRole("button", { name: "Créer l’agence" }));

    expect(
      await screen.findByText("Une agence porte déjà ce nom."),
    ).toBeInTheDocument();
  });

  it("refuse un faux succès de création hors contrat", async () => {
    server.use(
      http.post("/api/v1/agencies", () =>
        HttpResponse.json({}, { status: 201 }),
      ),
    );
    const user = userEvent.setup();
    renderApp("/agencies");

    await user.click(
      screen.getByRole("button", { name: "Ajouter une agence" }),
    );
    await user.type(screen.getByLabelText("Nom"), "Réponse invalide");
    await user.click(screen.getByRole("button", { name: "Créer l’agence" }));

    expect(
      await screen.findByText("L’API a renvoyé une réponse invalide."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/a été créée/)).not.toBeInTheDocument();
  });

  it("modifie une agence avec ses valeurs initiales", async () => {
    let currentAgencies = agencies;
    server.use(
      http.get("/api/v1/agencies", () =>
        HttpResponse.json({ data: currentAgencies }),
      ),
      http.patch("/api/v1/agencies/:id", async ({ params, request }) => {
        expect(params.id).toBe(agencies[0]?.id);
        expect(await request.json()).toEqual({
          name: "Agence renommée",
          notes: null,
        });
        const updatedAgency = {
          ...agencies[0]!,
          name: "Agence renommée",
          updatedAt: "2026-08-11T09:00:00.000Z",
        };
        currentAgencies = [updatedAgency, agencies[1]!];
        return HttpResponse.json({ data: updatedAgency });
      }),
    );
    const user = userEvent.setup();
    renderApp("/agencies");

    await screen.findByRole("heading", { name: "Agence active" });
    await user.click(
      firstAgencyCard().getByRole("button", {
        name: "Modifier",
      }),
    );
    expect(screen.getByLabelText("Nom")).toHaveValue("Agence active");
    expect(screen.getByLabelText(/Notes/)).toHaveValue("Note utile");

    await user.clear(screen.getByLabelText("Nom"));
    await user.type(screen.getByLabelText("Nom"), "Agence renommée");
    await user.clear(screen.getByLabelText(/Notes/));
    await user.click(
      screen.getByRole("button", { name: "Enregistrer les modifications" }),
    );

    expect(
      await screen.findByText("L’agence « Agence renommée » a été modifiée."),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Agence renommée" }),
    ).toBeInTheDocument();
  });

  it("n’envoie que les champs modifiés pendant l’édition", async () => {
    server.use(
      http.get("/api/v1/agencies", () => HttpResponse.json({ data: agencies })),

      http.patch("/api/v1/agencies/:id", async ({ request }) => {
        expect(await request.json()).toEqual({
          name: "Agence renommée",
        });

        const updatedAgency = {
          ...agencies[0]!,
          name: "Agence renommée",
          updatedAt: "2026-08-11T09:00:00.000Z",
        };

        return HttpResponse.json({
          data: updatedAgency,
        });
      }),
    );

    const user = userEvent.setup();
    renderApp("/agencies");

    await screen.findByRole("heading", {
      name: "Agence active",
    });
    await user.click(
      firstAgencyCard().getByRole("button", {
        name: "Modifier",
      }),
    );
    await user.clear(screen.getByLabelText("Nom"));
    await user.type(screen.getByLabelText("Nom"), "Agence renommée");
    await user.click(
      screen.getByRole("button", {
        name: "Enregistrer les modifications",
      }),
    );
    await screen.findByText("L’agence « Agence renommée » a été modifiée.");
  });

  it("actualise le formulaire lorsqu’une autre agence est sélectionnée", async () => {
    server.use(
      http.get("/api/v1/agencies", () => HttpResponse.json({ data: agencies })),
    );

    const user = userEvent.setup();
    renderApp("/agencies");

    await screen.findByRole("heading", {
      name: "Agence active",
    });

    const agencyItems = within(
      screen.getByRole("list", {
        name: "Liste des agences",
      }),
    ).getAllByRole("listitem");

    await user.click(
      within(agencyItems[0]!).getByRole("button", {
        name: "Modifier",
      }),
    );

    expect(screen.getByLabelText("Nom")).toHaveValue("Agence active");
    expect(screen.getByLabelText(/Notes/)).toHaveValue("Note utile");

    await user.click(
      within(agencyItems[1]!).getByRole("button", {
        name: "Modifier",
      }),
    );

    expect(screen.getByLabelText("Nom")).toHaveValue("Agence historique");
    expect(screen.getByLabelText(/Notes/)).toHaveValue("");
  });

  it("affiche une erreur métier pendant la modification", async () => {
    server.use(
      http.get("/api/v1/agencies", () => HttpResponse.json({ data: agencies })),
      http.patch("/api/v1/agencies/:id", () =>
        HttpResponse.json(
          {
            error: {
              code: "AGENCY_NAME_CONFLICT",
              message: "An agency with this name already exists.",
            },
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp("/agencies");

    await screen.findByRole("heading", { name: "Agence active" });
    await user.click(
      firstAgencyCard().getByRole("button", {
        name: "Modifier",
      }),
    );
    await user.clear(screen.getByLabelText("Nom"));
    await user.type(screen.getByLabelText("Nom"), "Agence historique");
    await user.click(
      screen.getByRole("button", { name: "Enregistrer les modifications" }),
    );

    expect(
      await screen.findByText("Une agence porte déjà ce nom."),
    ).toBeInTheDocument();
  });

  it("désactive une agence et actualise son statut", async () => {
    let currentAgencies = agencies;
    server.use(
      http.get("/api/v1/agencies", () =>
        HttpResponse.json({ data: currentAgencies }),
      ),
      http.patch("/api/v1/agencies/:id", async ({ request }) => {
        expect(await request.json()).toEqual({ isActive: false });
        const updatedAgency = {
          ...agencies[0]!,
          isActive: false,
          updatedAt: "2026-08-11T10:00:00.000Z",
        };
        currentAgencies = [updatedAgency, agencies[1]!];
        return HttpResponse.json({ data: updatedAgency });
      }),
    );
    const user = userEvent.setup();
    renderApp("/agencies");

    await screen.findByRole("heading", { name: "Agence active" });
    await user.click(
      firstAgencyCard().getByRole("button", {
        name: "Désactiver",
      }),
    );

    expect(
      await screen.findByText(
        "L’agence « Agence active » est maintenant inactive.",
      ),
    ).toBeInTheDocument();
    expect(firstAgencyCard().getByText("Inactive")).toBeInTheDocument();
  });

  it("réactive une agence inactive", async () => {
    let currentAgencies = agencies;
    server.use(
      http.get("/api/v1/agencies", () =>
        HttpResponse.json({ data: currentAgencies }),
      ),
      http.patch("/api/v1/agencies/:id", async ({ params, request }) => {
        expect(params.id).toBe(agencies[1]?.id);
        expect(await request.json()).toEqual({ isActive: true });
        const updatedAgency = {
          ...agencies[1]!,
          isActive: true,
          updatedAt: "2026-08-11T10:30:00.000Z",
        };
        currentAgencies = [agencies[0]!, updatedAgency];
        return HttpResponse.json({ data: updatedAgency });
      }),
    );
    const user = userEvent.setup();
    renderApp("/agencies");

    await screen.findByRole("heading", { name: "Agence historique" });
    const agencyItems = within(
      screen.getByRole("list", { name: "Liste des agences" }),
    ).getAllByRole("listitem");
    await user.click(
      within(agencyItems[1]!).getByRole("button", { name: "Activer" }),
    );

    expect(
      await screen.findByText(
        "L’agence « Agence historique » est maintenant active.",
      ),
    ).toBeInTheDocument();
  });

  it("conserve le statut après un refus de désactivation", async () => {
    server.use(
      http.get("/api/v1/agencies", () => HttpResponse.json({ data: agencies })),
      http.patch("/api/v1/agencies/:id", () =>
        HttpResponse.json(
          {
            error: {
              code: "AGENCY_HAS_PLANNED_LESSONS",
              message:
                "Complete or cancel the agency's planned lessons before deactivating it.",
            },
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp("/agencies");

    await screen.findByRole("heading", { name: "Agence active" });
    await user.click(
      firstAgencyCard().getByRole("button", {
        name: "Désactiver",
      }),
    );

    expect(
      await screen.findByText(
        "Terminez ou annulez les cours planifiés de cette agence avant de la désactiver.",
      ),
    ).toBeInTheDocument();
    expect(firstAgencyCard().getByText("Active")).toBeInTheDocument();
  });
});
