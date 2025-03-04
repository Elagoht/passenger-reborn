type PrismaErrorMap = Partial<
  Record<string, string | ((error: any) => string)>
>;
