export interface PageContext {
  domain: string;
  components: string[];
  files: string[];
  queryKeys: string[];
  endpoints: string[];
  optimizationTargets: string[];
  cacheableEndpoints: string[];
}

export interface PageContextRepository {
  register(domain: string, context: PageContext): Promise<void>;
  getContext(domain: string): Promise<PageContext | null>;
  getAllContexts(): Promise<Map<string, PageContext>>;
  hasContext(domain: string): Promise<boolean>;
} 