'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type {
  MilestoneFormState,
  MilestoneFormValues,
} from '@/lib/milestone-form';
import {
  AdminMilestoneWriteError,
  saveAdminMilestone,
  type AdminMilestone,
} from '@/lib/server/admin-milestones';

async function save(
  clientId: string,
  projectId: string,
  formData: FormData,
  milestoneId?: string,
): Promise<MilestoneFormState> {
  const text = (key: string): string => {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
  };
  const values: MilestoneFormValues = {
    title: text('title'),
    description: text('description'),
    status: text('status'),
    targetDate: text('targetDate'),
    completedAt: text('completedAt'),
    displayOrder: text('displayOrder'),
    isVisibleToClient: formData.get('isVisibleToClient') === 'on',
  };
  let milestone: AdminMilestone;
  try {
    milestone = await saveAdminMilestone(
      clientId,
      projectId,
      values,
      milestoneId,
    );
  } catch (error) {
    if (error instanceof AdminMilestoneWriteError) {
      return { values, fieldErrors: error.fieldErrors, message: error.message };
    }
    throw error;
  }
  const projectPath = `/clients/${encodeURIComponent(clientId)}/projects/${encodeURIComponent(projectId)}`;
  const milestonePath = `${projectPath}/milestones/${encodeURIComponent(milestone.id)}`;
  revalidatePath(projectPath);
  revalidatePath(`${projectPath}/milestones`);
  revalidatePath(milestonePath);
  redirect(
    `${milestonePath}?${milestoneId === undefined ? 'created' : 'saved'}=1`,
  );
}

export async function createMilestoneAction(
  clientId: string,
  projectId: string,
  _previousState: MilestoneFormState,
  formData: FormData,
): Promise<MilestoneFormState> {
  return save(clientId, projectId, formData);
}

export async function updateMilestoneAction(
  clientId: string,
  projectId: string,
  milestoneId: string,
  _previousState: MilestoneFormState,
  formData: FormData,
): Promise<MilestoneFormState> {
  return save(clientId, projectId, formData, milestoneId);
}
