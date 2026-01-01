declare module "sql.js" {
  interface Database {
    prepare(sql: string): Statement;
    close(): void;
  }

  interface Statement {
    bind(params: unknown[]): void;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): void;
  }

  interface InitSqlJsOptions {
    locateFile?: (file: string) => string;
  }

  function initSqlJs(options?: InitSqlJsOptions): Promise<{
    Database: new (data?: Uint8Array) => Database;
  }>;

  export default initSqlJs;
}
