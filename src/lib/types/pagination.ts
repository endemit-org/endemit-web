export const DEFAULT_PAGE_SIZE = 50;

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function calculatePagination(
  totalCount: number,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const skip = (page - 1) * pageSize;

  return {
    skip,
    take: pageSize,
    page,
    pageSize,
    totalPages,
  };
}
