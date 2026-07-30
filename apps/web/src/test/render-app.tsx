import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import { createQueryClient } from "../app/query-client";
import { appRoutes } from "../app/router";

export function renderApp(initialPath = "/") {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({
    queries: {
      retry: false,
      gcTime: 0,
    },
  });

  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialPath],
  });

  return {
    queryClient,
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  };
}
