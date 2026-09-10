export interface ClientFormValues {
  name: string;
  slug: string;
  status: string;
}

export type ClientFieldErrors = Partial<
  Record<keyof ClientFormValues, string[]>
>;

export interface ClientFormState {
  values: ClientFormValues;
  fieldErrors: ClientFieldErrors;
  message: string | null;
}

export const clientStatusLabels = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  ARCHIVED: "Archived",
} as const;
