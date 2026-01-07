import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ragService } from '@/services/ragService';
import type { HealthResponse, ServiceHealth } from '@/types/api';

export async function GET() {
  const services: ServiceHealth[] = [];
  let overallHealthy = true;

  // Check Supabase
  try {
    const start = Date.now();
    const supabase = await createClient();
    const { error } = await supabase.from('organizations').select('id').limit(1);
    const latency = Date.now() - start;

    if (error) {
      services.push({ name: 'supabase', healthy: false, error: error.message });
      overallHealthy = false;
    } else {
      services.push({ name: 'supabase', healthy: true, latencyMs: latency });
    }
  } catch (error) {
    services.push({
      name: 'supabase',
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    overallHealthy = false;
  }

  // Check RAG API
  try {
    const ragHealth = await ragService.checkHealth();
    services.push(...ragHealth.services);
    if (ragHealth.status === 'unhealthy') {
      overallHealthy = false;
    }
  } catch (error) {
    services.push({
      name: 'rag-api',
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    overallHealthy = false;
  }

  const response: HealthResponse = {
    status: overallHealthy ? 'healthy' : services.some((s) => s.healthy) ? 'degraded' : 'unhealthy',
    services,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, {
    status: overallHealthy ? 200 : 503,
  });
}
