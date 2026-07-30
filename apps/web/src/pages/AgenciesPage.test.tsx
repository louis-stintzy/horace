import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
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
  });

  it("affiche une erreur réseau", async () => {
    server.use(
      http.get("/api/v1/agencies", () => HttpResponse.error()),
    );
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
});
