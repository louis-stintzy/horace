import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../test/mocks/server";
import { renderApp } from "../test/render-app";

describe("navigation et santé", () => {
  it("affiche une santé réussie sur l’accueil", async () => {
    renderApp();

    expect(
      screen.getByRole("heading", { name: "Tableau de bord" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("API et base de données disponibles"),
    ).toBeInTheDocument();
  });

  it("navigue de l’accueil vers les agences", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("link", { name: "Agences" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Agences" }),
    ).toBeInTheDocument();
  });

  it("affiche la page 404", () => {
    renderApp("/route-inconnue");

    expect(
      screen.getByRole("heading", { name: "Page introuvable" }),
    ).toBeInTheDocument();
  });

  it("affiche une santé indisponible et permet une nouvelle tentative", async () => {
    let attempts = 0;
    server.use(
      http.get("/api/v1/health", () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json(
              {
                error: {
                  code: "INTERNAL_SERVER_ERROR",
                  message: "An unexpected error occurred.",
                },
              },
              { status: 500 },
            )
          : HttpResponse.json({ status: "ok" });
      }),
    );
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Réessayer" }));

    expect(
      await screen.findByText("API et base de données disponibles"),
    ).toBeInTheDocument();
    expect(attempts).toBe(2);
  });
});
