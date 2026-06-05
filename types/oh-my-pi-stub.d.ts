// Minimal type declarations for the oh-my-pi PiAPI and ExtensionAPI surface.
// This plugin is loaded at runtime by the oh-my-pi harness; these stubs
// let us compile against the real API shape without bundling the full SDK.

declare module "@oh-my-pi/pi-coding-agent" {
  export interface ExecOptions {
    timeout?: number;
    signal?: AbortSignal;
    cwd?: string;
  }

  export interface ExecResult {
    stdout: string;
    stderr: string;
    code: number;
    killed: boolean;
  }

  export interface Logger {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
  }

  export interface PiAPI {
    exec(command: string, args: string[], options?: ExecOptions): Promise<ExecResult>;
    logger: Logger;
  }

  // ---- Zod-like types provided by the host ----

  export interface ZodType<T = unknown> {
    _output: T;
    describe(description: string): this;
  }

  export interface ZodObject<T extends Record<string, ZodType>> extends ZodType<{
    [K in keyof T]: T[K]["_output"];
  }> {}

  export interface ZodRecord<K extends ZodType, V extends ZodType> extends ZodType<
    Record<K["_output"], V["_output"]>
  > {}

  export interface ZodAPI {
    object<T extends Record<string, ZodType>>(shape: T): ZodObject<T>;
    string(): ZodType<string>;
    number(): ZodType<number>;
    boolean(): ZodType<boolean>;
    unknown(): ZodType<unknown>;
    record<K extends ZodType, V extends ZodType>(key: K, value: V): ZodRecord<K, V>;
  }

  // ---- Extension tool types ----

  export type AgentToolUpdateCallback<TDetails = unknown> = (update: TDetails) => void;

  export interface AuthStorage {
    getApiKey(provider: string, sessionId?: string, options?: { signal?: AbortSignal }): Promise<string | undefined>;
  }

  export interface ExtensionContext {
    modelRegistry: {
      authStorage: AuthStorage;
    };
    sessionManager: {
      getSessionId(): string;
    };
  }

  export interface AgentToolResult<TDetails = unknown> {
    content: Array<{ type: "text"; text: string }>;
    details?: TDetails;
  }

  export interface ToolDefinition<T extends ZodType = ZodType, TDetails = unknown> {
    name: string;
    label: string;
    description: string;
    parameters: T;
    execute: (
      toolCallId: string,
      params: T["_output"],
      signal: AbortSignal | undefined,
      onUpdate: AgentToolUpdateCallback<TDetails> | undefined,
      ctx: ExtensionContext,
    ) => Promise<AgentToolResult<TDetails>>;
  }

  export interface ExtensionAPI extends PiAPI {
    registerTool<T extends ZodType, TDetails = unknown>(tool: ToolDefinition<T, TDetails>): void;
    zod: ZodAPI;
  }
}
