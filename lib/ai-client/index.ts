/**
 * AI Client Module
 * Centralized exports for AI functionality
 */

// Base client
export { AIClient, createAIClient } from './base';
export type { AIConfig, LLMMessage, LLMResponse, LLMTool, LLMToolCall, AIRequestOptions } from './base';

// Error types
export { AIClientError, toAIClientError, parseErrorCode } from './errors';
export type { AICode } from './errors';

// Study client
export { StudyAIClient, createStudyClient } from './study-client';
export type { StudyQuizType } from './study-client';

// Socratic client
export { SocraticAIClient, createSocraticClient } from './socratic-client';
