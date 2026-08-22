import type { components } from "../../shared/api/generated/schema";

export type Representative = components["schemas"]["Representative"];
export type RepresentativeResponse =
  components["schemas"]["RepresentativeResponse"];
export type RepresentativeListResponse =
  components["schemas"]["RepresentativeListResponse"];
type RepresentativeWritableFields =
  components["schemas"]["RepresentativeWritableFields"];

// openapi-typescript 7.13 génère actuellement les inputs Representative
// basés sur `allOf` + `unevaluatedProperties: false` avec une intersection
// `Record<string, never>`, ce qui les rend inutilisables.
// On dérive donc temporairement les inputs depuis RepresentativeWritableFields
// tout en conservant les champs obligatoires définis par OpenAPI.
export type CreateRepresentativeInput = Required<
  Pick<RepresentativeWritableFields, "firstName" | "lastName">
> &
  Omit<RepresentativeWritableFields, "firstName" | "lastName">;
export type UpdateRepresentativeInput = RepresentativeWritableFields;
