// =============================================================================
// RAG PROVIDER REGISTRY
// =============================================================================
// Singleton registry that manages state-specific RAG providers.
// Routes queries to the appropriate provider based on client state.

import { getStateConfig, getSupportedStates, type StateCode } from '@/config/stateConfig';
import type { RAGProviderInterface } from '@/types/rag';
import { FloridaRAGProvider } from './FloridaRAGProvider';
import { UtahRAGProvider } from './UtahRAGProvider';

class RAGProviderRegistry {
  private providers: Map<StateCode, RAGProviderInterface> = new Map();
  private defaultProvider: RAGProviderInterface | null = null;

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize all state providers based on configuration.
   */
  private initializeProviders(): void {
    const supportedStates = getSupportedStates();

    for (const stateCode of supportedStates) {
      const config = getStateConfig(stateCode);
      const provider = this.createProvider(stateCode, config);

      if (provider) {
        this.providers.set(stateCode, provider);

        // Set Florida as the default provider
        if (stateCode === 'FL') {
          this.defaultProvider = provider;
        }
      }
    }

    // Ensure we have a default provider
    if (!this.defaultProvider && this.providers.size > 0) {
      this.defaultProvider = this.providers.values().next().value ?? null;
    }
  }

  /**
   * Factory method to create the appropriate provider for a state.
   */
  private createProvider(
    stateCode: StateCode,
    config: ReturnType<typeof getStateConfig>
  ): RAGProviderInterface | null {
    switch (stateCode) {
      case 'FL':
        return new FloridaRAGProvider(config);
      case 'UT':
        return new UtahRAGProvider(config);
      // Add more states here as they become available
      // case 'NY':
      //   return new NewYorkRAGProvider(config);
      default:
        return null;
    }
  }

  /**
   * Get the provider for a specific state.
   * Falls back to the default provider (Florida) for unsupported states.
   */
  getProvider(stateCode: string): RAGProviderInterface {
    const upperCode = stateCode.toUpperCase();
    const provider = this.providers.get(upperCode);

    if (provider) {
      return provider;
    }

    // Fall back to default provider
    if (this.defaultProvider) {
      console.log(`No RAG provider for state "${stateCode}", using default (Florida)`);
      return this.defaultProvider;
    }

    throw new Error(`No RAG provider available for state "${stateCode}" and no default configured`);
  }

  /**
   * Check if a state has a dedicated provider.
   */
  hasProvider(stateCode: string): boolean {
    return this.providers.has(stateCode.toUpperCase());
  }

  /**
   * Get list of states with dedicated providers.
   */
  getAvailableStates(): StateCode[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get the default provider (Florida).
   */
  getDefaultProvider(): RAGProviderInterface {
    if (!this.defaultProvider) {
      throw new Error('No default RAG provider configured');
    }
    return this.defaultProvider;
  }

  /**
   * Check health of all providers.
   */
  async checkAllHealth(): Promise<
    Array<{
      stateCode: StateCode;
      status: 'healthy' | 'degraded' | 'unhealthy';
      message?: string;
    }>
  > {
    const results: Array<{
      stateCode: StateCode;
      status: 'healthy' | 'degraded' | 'unhealthy';
      message?: string;
    }> = [];

    const entries = Array.from(this.providers.entries());
    for (let i = 0; i < entries.length; i++) {
      const [stateCode, provider] = entries[i];
      const health = await provider.checkHealth();
      results.push({
        stateCode,
        ...health,
      });
    }

    return results;
  }

  /**
   * Check health of a specific provider.
   */
  async checkHealth(stateCode: string): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
  }> {
    const provider = this.getProvider(stateCode);
    return provider.checkHealth();
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const ragProviderRegistry = new RAGProviderRegistry();

// Re-export provider types for convenience
export { FloridaRAGProvider } from './FloridaRAGProvider';
export { UtahRAGProvider } from './UtahRAGProvider';
export { BaseRAGProvider } from './BaseRAGProvider';
