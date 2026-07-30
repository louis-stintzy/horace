import { queryOptions } from "@tanstack/react-query";

import { listAgencies } from "./agency.service";

export const agencyKeys = {
  all: ["agencies"] as const,
  lists: () => [...agencyKeys.all, "list"] as const,
  list: () => [...agencyKeys.lists()] as const,
};

export const agencyListQueryOptions = () =>
  queryOptions({
    queryKey: agencyKeys.list(),
    queryFn: ({ signal }) => listAgencies({ signal }),
  });
