export interface MembershipFormValues {
  userId: string;
  role: string;
}

export type MembershipFieldErrors = Partial<
  Record<keyof MembershipFormValues, string[]>
>;

export interface MembershipFormState {
  values: MembershipFormValues;
  fieldErrors: MembershipFieldErrors;
  message: string | null;
}

export interface MembershipRoleValues {
  role: string;
}

export interface MembershipRoleFormState {
  values: MembershipRoleValues;
  fieldErrors: MembershipFieldErrors;
  message: string | null;
}

export interface MembershipRemovalState {
  message: string | null;
}

export const membershipRoleLabels = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  MEMBER: 'Member',
} as const;
