import { MilestoneStatus } from '@algoworld/database';
import {
  createAdminMilestoneSchema,
  updateAdminMilestoneSchema,
} from './admin-milestones.schemas';

const input = {
  title: 'Design review',
  description: null,
  status: MilestoneStatus.PENDING,
  targetDate: null,
  completedAt: null,
  displayOrder: 10,
  isVisibleToClient: false,
};

describe('Admin milestone schemas', () => {
  it('trims the title and defaults new milestones to pending and internal', () => {
    expect(
      createAdminMilestoneSchema.parse({ title: '  Design review  ' }),
    ).toEqual({ ...input, displayOrder: 0 });
  });
  it('normalizes an empty description to null', () => {
    expect(
      createAdminMilestoneSchema.parse({ title: 'Review', description: '  ' })
        .description,
    ).toBeNull();
  });
  it.each(['', '   ', 'x'.repeat(161)])('rejects an invalid title', (title) => {
    expect(createAdminMilestoneSchema.safeParse({ title }).success).toBe(false);
  });
  it.each([
    '2026-02-30',
    '2026-02-29',
    '2026-13-01',
    '2026-9-01',
    '0000-01-01',
    '2026-09-11T00:00:00Z',
    '',
  ])('rejects invalid calendar date %s', (targetDate) => {
    expect(
      createAdminMilestoneSchema.safeParse({ title: 'Review', targetDate })
        .success,
    ).toBe(false);
  });
  it('accepts leap days and allows actual completion before or after the target', () => {
    expect(
      updateAdminMilestoneSchema.safeParse({
        ...input,
        targetDate: '2028-02-29',
        completedAt: '2028-02-20',
      }).success,
    ).toBe(true);
    expect(
      updateAdminMilestoneSchema.safeParse({
        ...input,
        targetDate: '2028-02-29',
        completedAt: '2028-03-02',
      }).success,
    ).toBe(true);
  });
  it.each([-1, 1.5, 2147483648, '10', null, NaN, Infinity])(
    'rejects invalid displayOrder %s',
    (displayOrder) => {
      expect(
        createAdminMilestoneSchema.safeParse({ title: 'Review', displayOrder })
          .success,
      ).toBe(false);
    },
  );
  it.each([0, 2147483647])(
    'accepts supported order boundary %s',
    (displayOrder) => {
      expect(
        updateAdminMilestoneSchema.safeParse({ ...input, displayOrder })
          .success,
      ).toBe(true);
    },
  );
  it.each(Object.values(MilestoneStatus))(
    'accepts status %s without inventing a completion date',
    (status) => {
      expect(
        updateAdminMilestoneSchema.parse({ ...input, status }).completedAt,
      ).toBeNull();
    },
  );
  it('rejects unknown statuses and string booleans', () => {
    expect(
      createAdminMilestoneSchema.safeParse({ ...input, status: 'PLANNING' })
        .success,
    ).toBe(false);
    expect(
      createAdminMilestoneSchema.safeParse({
        ...input,
        isVisibleToClient: 'false',
      }).success,
    ).toBe(false);
  });
  it.each(['id', 'projectId', 'clientId', 'createdAt', 'updatedAt'])(
    'rejects immutable field %s on either operation',
    (field) => {
      expect(
        createAdminMilestoneSchema.safeParse({ ...input, [field]: 'changed' })
          .success,
      ).toBe(false);
      expect(
        updateAdminMilestoneSchema.safeParse({ ...input, [field]: 'changed' })
          .success,
      ).toBe(false);
    },
  );
  it.each(Object.keys(input))(
    'requires editable field %s in a PUT',
    (field) => {
      const incomplete: Record<string, unknown> = { ...input };
      delete incomplete[field];
      expect(updateAdminMilestoneSchema.safeParse(incomplete).success).toBe(
        false,
      );
    },
  );
  it('limits description length', () => {
    expect(
      createAdminMilestoneSchema.safeParse({
        ...input,
        description: 'x'.repeat(10001),
      }).success,
    ).toBe(false);
  });
});
