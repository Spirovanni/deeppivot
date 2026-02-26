export interface JobApplication {
  id: number;
  company: string;
  position: string;
  location: string | null;
  salary: string | null;
  jobUrl: string | null;
  status: string;
  tags: string[];
  description: string | null;
  notes: string | null;
  order: number;
  columnId: number;
  userId: number;
  workflowId: string | null;
  /** 'external' | 'marketplace' — indicates origin of this card */
  sourceType?: string;
  /** FK to the marketplace job (populated for sourceType=marketplace) */
  marketplaceJobId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobColumn {
  id: number;
  name: string;
  order: number;
  boardId: number;
  jobs: JobApplication[];
}

export interface JobBoard {
  id: number;
  name: string;
  userId: number;
  columns: JobColumn[];
  createdAt: Date;
  updatedAt: Date;
}

export const COLUMN_COLORS: Record<string, string> = {
  Wishlist: "border-t-purple-500",
  Applied: "border-t-blue-500",
  Interviewing: "border-t-amber-500",
  Offer: "border-t-emerald-500",
  Rejected: "border-t-red-500",
};
