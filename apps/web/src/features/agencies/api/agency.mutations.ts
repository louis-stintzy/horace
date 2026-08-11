import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateAgencyInput, UpdateAgencyInput } from "../types";
import { createAgency, updateAgency } from "./agency.service";
import { agencyKeys } from "./agency.queries";

export function useCreateAgencyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAgencyInput) => createAgency(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: agencyKeys.all });
    },
  });
}

interface UpdateAgencyVariables {
  id: string;
  input: UpdateAgencyInput;
}

export function useUpdateAgencyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: UpdateAgencyVariables) =>
      updateAgency(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: agencyKeys.all });
    },
  });
}
