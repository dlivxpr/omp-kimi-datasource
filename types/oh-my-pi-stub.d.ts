// Minimal type declarations for the oh-my-pi PiAPI surface.
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
    exitCode: number;
  }

  export interface PiAPI {
    exec(command: string, args: string[], options?: ExecOptions): Promise<ExecResult>;
    logger: {
      debug(message: string, ...args: unknown[]): void;
      info(message: string, ...args: unknown[]): void;
      warn(message: string, ...args: unknown[]): void;
      error(message: string, ...args: unknown[]): void;
    };
  }
}
