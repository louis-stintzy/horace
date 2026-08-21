import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  CreateRepresentativeInput,
  UpdateRepresentativeInput,
} from "../types";
import { representativeKeys } from "./representative.queries";
import {
  createRepresentative,
  updateRepresentative,
} from "./representative.service";

export function useCreateRepresentativeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRepresentativeInput) =>
      createRepresentative(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: representativeKeys.all });
    },
  });
}

interface UpdateRepresentativeVariables {
  id: string;
  input: UpdateRepresentativeInput;
}

export function useUpdateRepresentativeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: UpdateRepresentativeVariables) =>
      updateRepresentative(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: representativeKeys.all });
    },
  });
}
