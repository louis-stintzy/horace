import { createBrowserRouter, type RouteObject } from "react-router-dom";

import { AgenciesPage } from "../pages/AgenciesPage";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { AppLayout } from "../shared/components/AppLayout";

export const appRoutes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "agencies", element: <AgenciesPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

export const appRouter = createBrowserRouter(appRoutes);
