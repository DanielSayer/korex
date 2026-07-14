declare module "pg" {
  export type QueryResultRow = Record<string, unknown>;

  export type QueryResult<T extends QueryResultRow> = {
    rowCount: number | null;
    rows: T[];
  };

  export class Pool {
    constructor(config?: {
      application_name?: string;
      connectionString?: string;
    });

    end(): Promise<void>;
    query<T extends QueryResultRow = QueryResultRow>(
      text: string,
      values?: unknown[],
    ): Promise<QueryResult<T>>;
  }
}
