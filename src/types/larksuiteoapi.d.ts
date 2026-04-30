declare module '@larksuiteoapi/node-sdk' {
  export const Domain: {
    Lark: string;
    Feishu: string;
  };
  export class Client {
    constructor(options: any);
    im: {
      message: {
        create: (data: any) => Promise<any>;
        reply: (data: any) => Promise<any>;
        list: (data: any) => Promise<any>;
        resource: (data: any) => Promise<any>;
      };
      chat: {
        get: (data: any) => Promise<any>;
        members: (data: any) => Promise<any>;
      };
      messageReaction: {
        create: (data: any) => Promise<any>;
        list: (data: any) => Promise<any>;
        delete: (data: any) => Promise<any>;
      };
    };
    auth: {
      tenantAccessToken: {
        internal: (data: any) => Promise<any>;
      };
    };
    application: {
      bot: {
        info: (data: any) => Promise<any>;
      };
    };
  }
  export class WSClient {
    constructor(options: any);
    start(options?: { eventDispatcher?: EventDispatcher }): Promise<void>;
    stop(): void;
    on(event: string, handler: (data: any) => void): void;
  }
  export class EventDispatcher {
    constructor(options: { encryptKey: string; verificationToken: string });
    register<T>(handlers: T): void;
  }
  export enum LoggerLevel {
    debug = 0,
    info = 1,
    warn = 2,
    error = 3,
  }
}
