import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

type QueryRendererProps<TData, TError> = {
  children: (data: TData) => ReactNode;
  error: ReactNode | ((error: TError) => ReactNode);
  loading: ReactNode;
  query: UseQueryResult<TData, TError>;
};

function QueryRenderer<TData, TError>({
  children,
  error,
  loading,
  query,
}: QueryRendererProps<TData, TError>) {
  if (query.isPending) {
    return loading;
  }

  if (query.isError) {
    return typeof error === "function" ? error(query.error) : error;
  }

  if (query.isSuccess) {
    return children(query.data);
  }

  return null;
}

export { QueryRenderer };
