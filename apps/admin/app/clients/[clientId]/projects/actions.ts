'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { ProjectFormState, ProjectFormValues } from '@/lib/project-form';
import {
  AdminProjectWriteError,
  saveAdminProject,
  type AdminProject,
} from '@/lib/server/admin-projects';

async function save(
  clientId: string,
  formData: FormData,
  projectId?: string,
): Promise<ProjectFormState> {
  const text = (key: string): string => {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
  };
  const values: ProjectFormValues = {
    name: text('name'),
    description: text('description'),
    status: text('status'),
    startDate: text('startDate'),
    targetEndDate: text('targetEndDate'),
    completedAt: text('completedAt'),
    isVisibleToClient: formData.get('isVisibleToClient') === 'on',
  };
  let project: AdminProject;
  try {
    project = await saveAdminProject(clientId, values, projectId);
  } catch (error) {
    if (error instanceof AdminProjectWriteError) {
      return { values, fieldErrors: error.fieldErrors, message: error.message };
    }
    throw error;
  }
  const clientPath = `/clients/${encodeURIComponent(project.clientId)}`;
  const projectPath = `${clientPath}/projects/${encodeURIComponent(project.id)}`;
  revalidatePath('/clients');
  revalidatePath(clientPath);
  revalidatePath(`${clientPath}/projects`);
  revalidatePath(projectPath);
  redirect(`${projectPath}?${projectId === undefined ? 'created' : 'saved'}=1`);
}

export async function createProjectAction(
  clientId: string,
  _previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  return save(clientId, formData);
}

export async function updateProjectAction(
  clientId: string,
  projectId: string,
  _previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  return save(clientId, formData, projectId);
}
