import type { components } from "../../shared/api/generated/schema";

export type Representative = components["schemas"]["Representative"];
export type RepresentativeResponse =
  components["schemas"]["RepresentativeResponse"];
export type RepresentativeListResponse =
  components["schemas"]["RepresentativeListResponse"];
type RepresentativeWritableFields =
  components["schemas"]["RepresentativeWritableFields"];

export type CreateRepresentativeInput = Required<
  Pick<RepresentativeWritableFields, "firstName" | "lastName">
> &
  Omit<RepresentativeWritableFields, "firstName" | "lastName">;
export type UpdateRepresentativeInput = RepresentativeWritableFields;
