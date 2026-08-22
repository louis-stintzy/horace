import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import type { Representative } from "../features/representatives/types";
import { server } from "../test/mocks/server";
import { renderApp } from "../test/render-app";

const representatives: Representative[] = [
  {
    id: "00000000-0000-4000-8000-000000000020",
    firstName: "Camille",
    lastName: "Martin",
    email: "camille@example.com",
    phone: "06 12 34 56 78",
    notes: "Responsable légal",
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000021",
    firstName: "Alex",
    lastName: "Petit",
    email: null,
    phone: null,
    notes: null,
    createdAt: "2026-07-02T08:00:00.000Z",
    updatedAt: "2026-07-02T08:00:00.000Z",
  },
];

const createdRepresentative: Representative = {
  id: "00000000-0000-4000-8000-000000000022",
  firstName: "Louise",
  lastName: "Durand",
  email: null,
  phone: null,
  notes: null,
  createdAt: "2026-08-21T08:00:00.000Z",
  updatedAt: "2026-08-21T08:00:00.000Z",
};

function representativeCards() {
  return within(
    screen.getByRole("list", { name: "Liste des représentants" }),
  ).getAllByRole("listitem");
}

describe("page représentants", () => {
  it("affiche le chargement puis les représentants dans l’ordre de l’API", async () => {
    server.use(
      http.get("/api/v1/representatives", async () => {
        await delay(100);
        return HttpResponse.json({ data: representatives });
      }),
    );
    renderApp("/representatives");

    expect(screen.getByRole("status")).toHaveTextContent(
      "Chargement des représentants…",
    );
    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings.map(({ textContent }) => textContent)).toEqual([
      "Camille Martin",
      "Alex Petit",
    ]);
    expect(screen.getByText("camille@example.com")).toBeInTheDocument();
    expect(screen.getByText("06 12 34 56 78")).toBeInTheDocument();
    expect(screen.getByText("Responsable légal")).toBeInTheDocument();
  });

  it("affiche l’état vide", async () => {
    renderApp("/representatives");

    expect(
      await screen.findByRole("heading", { name: "Aucun représentant" }),
    ).toBeInTheDocument();
  });

  it("affiche une erreur HTTP structurée", async () => {
    server.use(
      http.get("/api/v1/representatives", () =>
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
    renderApp("/representatives");

    expect(
      await screen.findByRole("heading", {
        name: "Impossible de charger les représentants",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Service temporairement indisponible."),
    ).toBeInTheDocument();
  });

  it("affiche une erreur réseau", async () => {
    server.use(http.get("/api/v1/representatives", () => HttpResponse.error()));
    renderApp("/representatives");

    expect(
      await screen.findByText(
        "L’API est injoignable. Vérifiez qu’elle est démarrée.",
      ),
    ).toBeInTheDocument();
  });

  it("relance la lecture après une erreur", async () => {
    let attempts = 0;
    server.use(
      http.get("/api/v1/representatives", () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.error()
          : HttpResponse.json({ data: representatives });
      }),
    );
    const user = userEvent.setup();
    renderApp("/representatives");

    await user.click(await screen.findByRole("button", { name: "Réessayer" }));

    expect(
      await screen.findByRole("heading", { name: "Camille Martin" }),
    ).toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it("rejette une liste 2xx hors contrat", async () => {
    server.use(
      http.get("/api/v1/representatives", () => HttpResponse.json({})),
    );
    renderApp("/representatives");

    expect(
      await screen.findByText("L’API a renvoyé une réponse invalide."),
    ).toBeInTheDocument();
  });

  it("ouvre le formulaire et relie ses erreurs aux champs", async () => {
    const user = userEvent.setup();
    renderApp("/representatives");

    await user.click(
      screen.getByRole("button", { name: "Ajouter un représentant" }),
    );
    await user.type(screen.getByLabelText(/Email/), "email-invalide");
    await user.click(
      screen.getByRole("button", { name: "Créer le représentant" }),
    );

    for (const [label, message] of [
      ["Prénom", "Le prénom est requis."],
      ["Nom", "Le nom est requis."],
      [/Email/, "L’adresse email est invalide."],
    ] as const) {
      const input = screen.getByLabelText(label);
      const error = await screen.findByText(message);
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby", error.id);
    }
  });

  it("crée un représentant, omet les champs vides et actualise la liste", async () => {
    let currentRepresentatives = representatives;
    server.use(
      http.get("/api/v1/representatives", () =>
        HttpResponse.json({ data: currentRepresentatives }),
      ),
      http.post("/api/v1/representatives", async ({ request }) => {
        expect(await request.json()).toEqual({
          firstName: "Louise",
          lastName: "Durand",
        });
        currentRepresentatives = [...representatives, createdRepresentative];
        return HttpResponse.json(
          { data: createdRepresentative },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    renderApp("/representatives");

    await screen.findByRole("heading", { name: "Camille Martin" });
    await user.click(
      screen.getByRole("button", { name: "Ajouter un représentant" }),
    );
    await user.type(screen.getByLabelText("Prénom"), " Louise ");
    await user.type(screen.getByLabelText("Nom"), " Durand ");
    await user.click(
      screen.getByRole("button", { name: "Créer le représentant" }),
    );

    expect(
      await screen.findByText("Louise Durand a été ajouté."),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Louise Durand" }),
    ).toBeInTheDocument();
  });

  it("affiche une erreur de validation renvoyée par l’API", async () => {
    server.use(
      http.post("/api/v1/representatives", () =>
        HttpResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request data.",
              details: [{ path: "email", message: "Invalid email" }],
            },
          },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp("/representatives");

    await user.click(
      screen.getByRole("button", { name: "Ajouter un représentant" }),
    );
    await user.type(screen.getByLabelText("Prénom"), "Louise");
    await user.type(screen.getByLabelText("Nom"), "Durand");
    await user.click(
      screen.getByRole("button", { name: "Créer le représentant" }),
    );

    expect(
      await screen.findByText(
        "Certaines informations sont invalides. Vérifiez le formulaire.",
      ),
    ).toBeInTheDocument();
  });

  it("refuse un faux succès de création hors contrat", async () => {
    server.use(
      http.post("/api/v1/representatives", () =>
        HttpResponse.json({}, { status: 201 }),
      ),
    );
    const user = userEvent.setup();
    renderApp("/representatives");

    await user.click(
      screen.getByRole("button", { name: "Ajouter un représentant" }),
    );
    await user.type(screen.getByLabelText("Prénom"), "Louise");
    await user.type(screen.getByLabelText("Nom"), "Durand");
    await user.click(
      screen.getByRole("button", { name: "Créer le représentant" }),
    );

    expect(
      await screen.findByText("L’API a renvoyé une réponse invalide."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/a été ajouté/)).not.toBeInTheDocument();
  });

  it("initialise l’édition et change correctement de représentant", async () => {
    server.use(
      http.get("/api/v1/representatives", () =>
        HttpResponse.json({ data: representatives }),
      ),
    );
    const user = userEvent.setup();
    renderApp("/representatives");

    await screen.findByRole("heading", { name: "Camille Martin" });
    const cards = representativeCards();
    await user.click(
      within(cards[0]!).getByRole("button", { name: "Modifier" }),
    );
    expect(screen.getByLabelText("Prénom")).toHaveValue("Camille");
    expect(screen.getByLabelText("Nom")).toHaveValue("Martin");
    expect(screen.getByLabelText(/Email/)).toHaveValue("camille@example.com");
    expect(
      screen.getByRole("button", {
        name: "Enregistrer les modifications",
      }),
    ).toBeDisabled();

    await user.click(
      within(cards[1]!).getByRole("button", { name: "Modifier" }),
    );
    expect(screen.getByLabelText("Prénom")).toHaveValue("Alex");
    expect(screen.getByLabelText("Nom")).toHaveValue("Petit");
    expect(screen.getByLabelText(/Email/)).toHaveValue("");
  });

  it("envoie seulement les champs dirty et null pour effacer une valeur", async () => {
    let currentRepresentatives = representatives;
    server.use(
      http.get("/api/v1/representatives", () =>
        HttpResponse.json({ data: currentRepresentatives }),
      ),
      http.patch("/api/v1/representatives/:id", async ({ params, request }) => {
        expect(params.id).toBe(representatives[0]?.id);
        expect(await request.json()).toEqual({
          lastName: "Bernard",
          email: null,
        });
        const updated = {
          ...representatives[0]!,
          lastName: "Bernard",
          email: null,
          updatedAt: "2026-08-21T09:00:00.000Z",
        };
        currentRepresentatives = [updated, representatives[1]!];
        return HttpResponse.json({ data: updated });
      }),
    );
    const user = userEvent.setup();
    renderApp("/representatives");

    await screen.findByRole("heading", { name: "Camille Martin" });
    await user.click(
      within(representativeCards()[0]!).getByRole("button", {
        name: "Modifier",
      }),
    );
    await user.clear(screen.getByLabelText("Nom"));
    await user.type(screen.getByLabelText("Nom"), "Bernard");
    await user.clear(screen.getByLabelText(/Email/));
    await user.click(
      screen.getByRole("button", { name: "Enregistrer les modifications" }),
    );

    expect(
      await screen.findByText("Camille Bernard a été modifié."),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Camille Bernard" }),
    ).toBeInTheDocument();
  });

  it("affiche l’erreur Representative introuvable en édition", async () => {
    server.use(
      http.get("/api/v1/representatives", () =>
        HttpResponse.json({ data: representatives }),
      ),
      http.patch("/api/v1/representatives/:id", () =>
        HttpResponse.json(
          {
            error: {
              code: "REPRESENTATIVE_NOT_FOUND",
              message: "Representative not found.",
            },
          },
          { status: 404 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp("/representatives");

    await screen.findByRole("heading", { name: "Camille Martin" });
    await user.click(
      within(representativeCards()[0]!).getByRole("button", {
        name: "Modifier",
      }),
    );
    await user.clear(screen.getByLabelText("Prénom"));
    await user.type(screen.getByLabelText("Prénom"), "Camilla");
    await user.click(
      screen.getByRole("button", { name: "Enregistrer les modifications" }),
    );

    expect(
      await screen.findByText(
        "Ce représentant n’existe plus ou n’est plus accessible.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Modifier Camille Martin",
      }),
    ).toBeInTheDocument();
  });

  it("désactive les actions et empêche le changement de contexte pendant une mutation", async () => {
    let currentRepresentatives = representatives;
    let postCount = 0;
    server.use(
      http.get("/api/v1/representatives", () =>
        HttpResponse.json({ data: currentRepresentatives }),
      ),
      http.post("/api/v1/representatives", async () => {
        postCount += 1;
        await delay(150);
        currentRepresentatives = [...representatives, createdRepresentative];
        return HttpResponse.json(
          { data: createdRepresentative },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    renderApp("/representatives");

    await screen.findByRole("heading", { name: "Camille Martin" });
    await user.click(
      screen.getByRole("button", { name: "Ajouter un représentant" }),
    );
    await user.type(screen.getByLabelText("Prénom"), "Louise");
    await user.type(screen.getByLabelText("Nom"), "Durand");
    await user.click(
      screen.getByRole("button", { name: "Créer le représentant" }),
    );

    expect(
      screen.getByRole("button", { name: "Enregistrement…" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Annuler" })).toBeDisabled();
    for (const button of screen.getAllByRole("button", { name: "Modifier" })) {
      expect(button).toBeDisabled();
      await user.click(button);
    }
    expect(
      screen.queryByRole("heading", { name: "Modifier Camille Martin" }),
    ).not.toBeInTheDocument();

    expect(
      await screen.findByText("Louise Durand a été ajouté."),
    ).toBeInTheDocument();
    expect(postCount).toBe(1);
  });

  it("empêche deux créations concurrentes", async () => {
    let currentRepresentatives = representatives;
    let postCount = 0;

    server.use(
      http.get("/api/v1/representatives", () =>
        HttpResponse.json({
          data: currentRepresentatives,
        }),
      ),
      http.post("/api/v1/representatives", async () => {
        postCount += 1;
        await delay(150);
        currentRepresentatives = [...representatives, createdRepresentative];
        return HttpResponse.json(
          { data: createdRepresentative },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderApp("/representatives");

    await user.click(
      screen.getByRole("button", {
        name: "Ajouter un représentant",
      }),
    );
    await user.type(screen.getByLabelText("Prénom"), "Louise");
    await user.type(screen.getByLabelText("Nom"), "Durand");

    const submitButton = screen.getByRole("button", {
      name: "Créer le représentant",
    });
    const form = submitButton.closest("form");

    expect(form).not.toBeNull();

    if (!form) {
      throw new Error("Le formulaire de création est introuvable.");
    }

    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(
      await screen.findByText("Louise Durand a été ajouté."),
    ).toBeInTheDocument();

    expect(postCount).toBe(1);
  });
});
