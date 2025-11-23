declare module 'modelpilot' {
  class ModelPilot {
    constructor(config: {
      apiKey: string;
      routerId: string;
      baseURL?: string;
      timeout?: number;
      defaultHeaders?: any;
      maxRetries?: number;
    });
    chat: {
      create: (params: any) => Promise<any>;
    };
    request(endpoint: string, options?: any): Promise<any>;
    getRouterConfig(): Promise<any>;
    getModels(): Promise<any>;
  }
  export default ModelPilot;
}
