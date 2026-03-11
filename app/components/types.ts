export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  createdBy?: string;
}

export interface IssueFormData {
  assignedTo: string;
  dueDate: string;
  priority: string;
  description: string;
  newComment?: string;
}

export interface Issue extends IssueFormData {
  id: string;
  createdAt: string;
  comments?: Comment[];
  status?: 'open' | 'closed';
  closedAt?: string;
}

