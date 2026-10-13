export interface ShortLinkRecord {
  id: string;
  code: string;
  targetUrl: string;
  description: string | null;
  isActive: boolean;
  clickCount: number;
  lastClickAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShortLinkInput {
  /** Omitted or empty means "generate a random code". */
  code?: string;
  targetUrl: string;
  description?: string;
  isActive?: boolean;
}
