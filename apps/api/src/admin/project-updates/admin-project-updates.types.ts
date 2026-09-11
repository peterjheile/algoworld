export interface AdminProjectUpdate {
  id: string;
  projectId: string;
  authorUserId: string | null;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  title: string;
  content: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
