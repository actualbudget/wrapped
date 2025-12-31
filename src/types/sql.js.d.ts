declare module "sql.js" {
  interface Database {
    prepare(sql: string): Statement;
    close(): void;
  }

  interface Statement {
    bind(params: any[]): void;
    step(): boolean;
    getAsObject(): any;
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
