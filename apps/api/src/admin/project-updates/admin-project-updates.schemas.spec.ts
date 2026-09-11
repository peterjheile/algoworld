import {
  createAdminProjectUpdateSchema,
  updateAdminProjectUpdateSchema,
} from './admin-project-updates.schemas';
const input = {
  title: 'Design approved',
  content: 'Development starts next week.',
};

describe('Admin project update schemas', () => {
  it('trims text and defaults creation to draft', () => {
    expect(
      createAdminProjectUpdateSchema.parse({
        title: ' Design approved ',
        content: ' Development starts next week. ',
      }),
    ).toEqual({ ...input, publication: { mode: 'DRAFT' } });
  });
  it.each(['title', 'content'])('requires nonblank %s', (field) => {
    expect(
      createAdminProjectUpdateSchema.safeParse({ ...input, [field]: '  ' })
        .success,
    ).toBe(false);
    const missing: Record<string, unknown> = { ...input };
    delete missing[field];
    expect(createAdminProjectUpdateSchema.safeParse(missing).success).toBe(
      false,
    );
  });
  it.each([{ title: 'x'.repeat(161) }, { content: 'x'.repeat(20001) }])(
    'rejects oversized input',
    (extra) => {
      expect(
        createAdminProjectUpdateSchema.safeParse({ ...input, ...extra })
          .success,
      ).toBe(false);
    },
  );
  it.each(['DRAFT', 'PUBLISH_NOW'])('accepts publication mode %s', (mode) => {
    expect(
      createAdminProjectUpdateSchema.safeParse({
        ...input,
        publication: { mode },
      }).success,
    ).toBe(true);
    expect(
      updateAdminProjectUpdateSchema.safeParse({
        ...input,
        publication: { mode },
      }).success,
    ).toBe(true);
  });
  it('accepts canonical UTC scheduling including leap days', () => {
    expect(
      createAdminProjectUpdateSchema.safeParse({
        ...input,
        publication: {
          mode: 'SCHEDULE',
          publishedAt: '2028-02-29T15:30:00.000Z',
        },
      }).success,
    ).toBe(true);
  });
  it.each([
    '2026-02-30T15:30:00.000Z',
    '2026-02-29T15:30:00.000Z',
    '2026-09-11T24:00:00.000Z',
    '2026-09-11T12:60:00.000Z',
    '2026-09-11T12:00',
    '2026-09-11',
    '2026-09-11T12:00:00.000-04:00',
    '0000-01-01T00:00:00.000Z',
    '',
  ])('rejects invalid or noncanonical schedule %s', (publishedAt) => {
    expect(
      createAdminProjectUpdateSchema.safeParse({
        ...input,
        publication: { mode: 'SCHEDULE', publishedAt },
      }).success,
    ).toBe(false);
  });
  it('requires a timestamp for scheduling', () => {
    expect(
      createAdminProjectUpdateSchema.safeParse({
        ...input,
        publication: { mode: 'SCHEDULE' },
      }).success,
    ).toBe(false);
  });
  it('allows KEEP only on an existing update', () => {
    expect(
      createAdminProjectUpdateSchema.safeParse({
        ...input,
        publication: { mode: 'KEEP' },
      }).success,
    ).toBe(false);
    expect(
      updateAdminProjectUpdateSchema.safeParse({
        ...input,
        publication: { mode: 'KEEP' },
      }).success,
    ).toBe(true);
  });
  it.each(['title', 'content', 'publication'])(
    'requires explicit editable field %s on update',
    (field) => {
      const missing: Record<string, unknown> = {
        ...input,
        publication: { mode: 'KEEP' },
      };
      delete missing[field];
      expect(updateAdminProjectUpdateSchema.safeParse(missing).success).toBe(
        false,
      );
    },
  );
  it.each([
    'id',
    'projectId',
    'clientId',
    'authorUserId',
    'author',
    'publishedAt',
    'createdAt',
    'updatedAt',
  ])('rejects injected field %s on both operations', (field) => {
    const data = {
      ...input,
      publication: { mode: 'DRAFT' },
      [field]: 'injected',
    };
    expect(createAdminProjectUpdateSchema.safeParse(data).success).toBe(false);
    expect(updateAdminProjectUpdateSchema.safeParse(data).success).toBe(false);
  });
  it.each(['KEEP', 'DRAFT', 'PUBLISH_NOW'])(
    'rejects an ignored timestamp attached to %s',
    (mode) => {
      expect(
        updateAdminProjectUpdateSchema.safeParse({
          ...input,
          publication: { mode, publishedAt: '2027-01-01T00:00:00.000Z' },
        }).success,
      ).toBe(false);
    },
  );
  it.each(['PUBLISHED', 'publish_now', '', null])(
    'rejects unknown publication mode %s',
    (mode) => {
      expect(
        updateAdminProjectUpdateSchema.safeParse({
          ...input,
          publication: { mode },
        }).success,
      ).toBe(false);
    },
  );
});
