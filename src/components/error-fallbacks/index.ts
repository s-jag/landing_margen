/**
 * Error Fallback Components
 *
 * Pre-built fallback UIs for different error boundary contexts:
 * - PageErrorFallback: Full-page errors with reload option
 * - PanelErrorFallback: Contained sidebar/panel errors
 * - ModalErrorFallback: Modal-specific errors with close option
 */

export { PageErrorFallback } from './PageErrorFallback';
export { PanelErrorFallback } from './PanelErrorFallback';
export { ModalErrorFallback, createModalErrorFallback } from './ModalErrorFallback';
