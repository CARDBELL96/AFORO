// Capa de acceso a datos. HOY lee los eventos de demostración locales con una latencia simulada
// para poder construir los estados de carga y error. Cuando exista backend, solo se cambia este archivo.
import { EVENTS, type AforoEvent } from './events';

export const SIMULATED_LATENCY_MS = 500;

export interface FetchOptions {
  /** Solo para pruebas visuales: fuerza el estado de error (?simular=error). */
  simulate?: 'error' | null;
}

export async function fetchEvents(opts: FetchOptions = {}): Promise<AforoEvent[]> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
  if (opts.simulate === 'error') throw new Error('Error simulado al cargar los eventos');
  return EVENTS;
}
