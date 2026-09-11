import {
  createAdminProjectSchema,
  updateAdminProjectSchema,
} from './admin-project.schemas';

describe('admin project validation', () => {
  const input = {
    name: 'Website',
    description: null,
    status: 'PLANNING',
    startDate: null,
    targetEndDate: null,
    completedAt: null,
    isVisibleToClient: false,
  };

  it('creates a hidden planning project with optional fields unset', () => {
    expect(createAdminProjectSchema.parse({ name: '  Website  ' })).toEqual(
      input,
    );
  });

  it('normalizes an empty description to null', () => {
    expect(
      updateAdminProjectSchema.parse({ ...input, description: '  ' })
        .description,
    ).toBeNull();
  });

  it.each([
    { name: ' ' },
    { status: 'INVALID' },
    { isVisibleToClient: 'false' },
    { clientId: 'other-client' },
    { id: 'other-project' },
    { milestones: [] },
    { startDate: '2026-02-30' },
    { startDate: '2026-02-29' },
    { startDate: 'not-a-date' },
    { startDate: '2026-09-10T00:00:00.000Z' },
    { name: 'a'.repeat(161) },
    { description: 'a'.repeat(10001) },
  ])('rejects invalid or immutable fields: %j', (change) => {
    expect(
      updateAdminProjectSchema.safeParse({ ...input, ...change }).success,
    ).toBe(false);
  });

  it('accepts leap days and optional unscheduled dates', () => {
    expect(
      updateAdminProjectSchema.safeParse({ ...input, startDate: '2028-02-29' })
        .success,
    ).toBe(true);
    expect(updateAdminProjectSchema.safeParse(input).success).toBe(true);
  });

  it.each(['targetEndDate', 'completedAt'] as const)(
    'rejects %s before the start date with a field error',
    (field) => {
      const parsed = updateAdminProjectSchema.safeParse({
        ...input,
        startDate: '2026-09-10',
        [field]: '2026-09-09',
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success)
        expect(
          parsed.error.flatten().fieldErrors[field]?.length,
        ).toBeGreaterThan(0);
    },
  );

  it('allows same-day completion and completion after a target date', () => {
    expect(
      updateAdminProjectSchema.safeParse({
        ...input,
        startDate: '2026-09-10',
        targetEndDate: '2026-09-10',
        completedAt: '2026-09-11',
      }).success,
    ).toBe(true);
  });

  it('requires the complete editable form on PUT', () => {
    expect(
      updateAdminProjectSchema.safeParse({ name: 'Only a name' }).success,
    ).toBe(false);
  });

  it('does not invent a completion date from status', () => {
    expect(
      updateAdminProjectSchema.parse({ ...input, status: 'COMPLETED' })
        .completedAt,
    ).toBeNull();
  });
});
