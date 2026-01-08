// =============================================================================
// STATE RAG CONFIGURATION
// =============================================================================
// Configuration for state-specific RAG API providers.
// Each state can have its own API endpoint and capabilities.

export type StateCode = 'FL' | 'UT' | 'NY' | 'CA' | 'TX' | string;

export interface StateCapabilities {
  supportsStreaming: boolean;
  supportsSourceDrilldown: boolean;
  hasTaxForms: boolean;
  hasTaxTypeClassification: boolean;
  hasAuthorityLevels: boolean;
}

export interface StateRAGConfig {
  stateCode: StateCode;
  stateName: string;
  apiBaseUrl: string;
  apiKey?: string;
  capabilities: StateCapabilities;
  // Endpoint paths (differ between APIs)
  endpoints: {
    query: string;
    queryStream?: string;
    sources?: string;
    health: string;
    forms?: string;
    formDetail?: string;
  };
}

// =============================================================================
// STATE CONFIGURATIONS
// =============================================================================

const FLORIDA_CONFIG: StateRAGConfig = {
  stateCode: 'FL',
  stateName: 'Florida',
  apiBaseUrl: process.env.FLORIDA_RAG_API_URL || process.env.RAG_API_BASE_URL || 'http://localhost:8001',
  apiKey: process.env.FLORIDA_RAG_API_KEY || process.env.RAG_API_KEY,
  capabilities: {
    supportsStreaming: true,
    supportsSourceDrilldown: true,
    hasTaxForms: false,
    hasTaxTypeClassification: false,
    hasAuthorityLevels: false,
  },
  endpoints: {
    query: '/api/v1/query',
    queryStream: '/api/v1/query/stream',
    sources: '/api/v1/sources',
    health: '/api/v1/health',
  },
};

const UTAH_CONFIG: StateRAGConfig = {
  stateCode: 'UT',
  stateName: 'Utah',
  apiBaseUrl: process.env.UTAH_RAG_API_URL || 'http://localhost:8000',
  apiKey: process.env.UTAH_RAG_API_KEY,
  capabilities: {
    supportsStreaming: false,
    supportsSourceDrilldown: false,
    hasTaxForms: true,
    hasTaxTypeClassification: true,
    hasAuthorityLevels: true,
  },
  endpoints: {
    query: '/query',
    health: '/health',
    forms: '/forms',
    formDetail: '/forms',
  },
};

// Future state configs can be added here
// const NEW_YORK_CONFIG: StateRAGConfig = { ... };

// =============================================================================
// STATE CONFIG MAP
// =============================================================================

export const STATE_CONFIG: Record<StateCode, StateRAGConfig> = {
  FL: FLORIDA_CONFIG,
  UT: UTAH_CONFIG,
  // Add more states as they become available
};

// Default fallback for states without specific RAG APIs
const DEFAULT_CONFIG = FLORIDA_CONFIG;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the RAG configuration for a given state code.
 * Falls back to Florida config for unsupported states.
 */
export function getStateConfig(stateCode: string): StateRAGConfig {
  const upperCode = stateCode.toUpperCase();
  return STATE_CONFIG[upperCode] || DEFAULT_CONFIG;
}

/**
 * Check if a state has its own dedicated RAG API.
 */
export function hasStateSpecificAPI(stateCode: string): boolean {
  const upperCode = stateCode.toUpperCase();
  return upperCode in STATE_CONFIG;
}

/**
 * Get list of states with dedicated RAG APIs.
 */
export function getSupportedStates(): StateCode[] {
  return Object.keys(STATE_CONFIG) as StateCode[];
}

/**
 * Check if a state supports a specific capability.
 */
export function stateSupports(
  stateCode: string,
  capability: keyof StateCapabilities
): boolean {
  const config = getStateConfig(stateCode);
  return config.capabilities[capability];
}
