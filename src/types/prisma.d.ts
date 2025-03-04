type PrismaErrorMap = Partial<
  Record<string, string | ((error: any) => string)>
>;

interface PaginationParams {
  page: number;
  take: number | undefined;
}
