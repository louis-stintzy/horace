import { queryOptions } from "@tanstack/react-query";

import { listRepresentatives } from "./representative.service";

export const representativeKeys = {
  all: ["representatives"] as const,
  lists: () => [...representativeKeys.all, "list"] as const,
  list: () => [...representativeKeys.lists()] as const,
};

export const representativeListQueryOptions = () =>
  queryOptions({
    queryKey: representativeKeys.list(),
    queryFn: ({ signal }) => listRepresentatives({ signal }),
  });
