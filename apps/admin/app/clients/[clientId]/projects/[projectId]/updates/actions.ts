'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type {
  ProjectUpdateFormState,
  ProjectUpdateFormValues,
} from '@/lib/project-update-form';
import {
  AdminProjectUpdateWriteError,
  saveAdminProjectUpdate,
  type AdminProjectUpdate,
} from '@/lib/server/admin-project-updates';

async function save(
  clientId: string,
  projectId: string,
  formData: FormData,
  updateId?: string,
): Promise<ProjectUpdateFormState> {
  const text = (key: string): string => {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
  };
  const values: ProjectUpdateFormValues = {
    title: text('title'),
    content: text('content'),
    publicationMode: text('publicationMode'),
    scheduledFor: text('scheduledFor'),
  };
  let update: AdminProjectUpdate;
  try {
    update = await saveAdminProjectUpdate(
      clientId,
      projectId,
      values,
      updateId,
    );
  } catch (error) {
    if (error instanceof AdminProjectUpdateWriteError)
      return { values, fieldErrors: error.fieldErrors, message: error.message };
    throw error;
  }
  const projectPath = `/clients/${encodeURIComponent(clientId)}/projects/${encodeURIComponent(projectId)}`;
  const updatePath = `${projectPath}/updates/${encodeURIComponent(update.id)}`;
  revalidatePath(projectPath);
  revalidatePath(`${projectPath}/updates`);
  revalidatePath(updatePath);
  redirect(`${updatePath}?${updateId === undefined ? 'created' : 'saved'}=1`);
}
export async function createProjectUpdateAction(
  clientId: string,
  projectId: string,
  _previousState: ProjectUpdateFormState,
  formData: FormData,
): Promise<ProjectUpdateFormState> {
  return save(clientId, projectId, formData);
}
export async function updateProjectUpdateAction(
  clientId: string,
  projectId: string,
  updateId: string,
  _previousState: ProjectUpdateFormState,
  formData: FormData,
): Promise<ProjectUpdateFormState> {
  return save(clientId, projectId, formData, updateId);
}
