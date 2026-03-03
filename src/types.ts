/**
 * Core type definitions for OpportunityOS
 */

// ============================================================================
// Enums
// ============================================================================

export enum OpportunityStatus {
  DETECTED = 'detected',
  PROMOTED = 'promoted',
  DISMISSED = 'dismissed',
  INVESTIGATING = 'investigating',
  SPEC_GENERATED = 'spec_generated',
  SHIPPED = 'shipped',
}

export enum OpportunityType {
  FUNNEL_DROP = 'funnel_drop',
  LOW_NPS = 'low_nps',
  FEATURE_UNDERUSE = 'feature_underuse',
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface UserpilotConfig {
  apiToken: string;
  baseUrl?: string;
}

export interface SlackConfig {
  botToken: string;
  appToken: string;
  channelId: string;
}

export interface KiroConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface OpportunityOSConfig {
  userpilot: UserpilotConfig;
  slack: SlackConfig;
  kiro: KiroConfig;
  detectionSchedule?: string; // cron expression, default: '0 9 * * 1' (Monday 9am)
  dataStorePath?: string; // default: './data/opportunities.json'
  logLevel?: LogLevel; // default: INFO
  minOpportunityScore?: number; // default: 60
  autoGenerateSpecs?: boolean; // Auto-generate specs on promote, or require manual approval (default: false)
}

// ============================================================================
// Analytics Data Types
// ============================================================================

export interface FunnelData {
  funnelId: string;
  funnelName: string;
  steps: FunnelStep[];
  dateRange: DateRange;
}

export interface FunnelStep {
  stepName: string;
  userCount: number;
  dropoffRate: number;
}

export interface NPSData {
  score: number;
  responseCount: number;
  detractors: NPSResponse[];
  passives: NPSResponse[];
  promoters: NPSResponse[];
  dateRange: DateRange;
}

export interface NPSResponse {
  userId: string;
  score: number;
  feedback?: string;
  timestamp: string;
}

export interface FeatureUsageData {
  featureId: string;
  featureName: string;
  activeUsers: number;
  totalUsers: number;
  usageRate: number;
  dateRange: DateRange;
}

export interface DateRange {
  start: string; // ISO 8601
  end: string; // ISO 8601
}

/**
 * Custom query structure for provider-specific raw event queries.
 * Each adapter can define its own query format based on the provider's API.
 */
export interface CustomQuery {
  [key: string]: unknown;
}

/**
 * Raw event data structure for custom queries.
 * Used by adapters that support the optional getRawEvents method.
 */
export interface EventData {
  eventName: string;
  timestamp: string; // ISO 8601
  userId: string;
  properties: Record<string, unknown>;
}

// ============================================================================
// Opportunity Types
// ============================================================================

export interface Opportunity {
  id: string; // UUID
  type: OpportunityType;
  status: OpportunityStatus;
  score: number; // 0-100
  title: string;
  description: string;
  evidence: Evidence;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  slackMessageTs?: string; // Slack message timestamp for updates
  specUrl?: string; // URL to generated spec (if status >= SPEC_GENERATED)
  actualImpact?: ActualImpact; // Post-ship metrics (if status === SHIPPED)
}

export interface Evidence {
  dataSource: 'userpilot';
  rawData: FunnelData | NPSData | FeatureUsageData;
  metrics: Record<string, number>;
  insights: string[];
}

export interface ActualImpact {
  metricsBefore: Record<string, number>;
  metricsAfter: Record<string, number>;
  measuredAt: string; // ISO 8601
}

// ============================================================================
// Slack Types
// ============================================================================

export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  elements?: unknown[];
  accessory?: unknown;
  fields?: Array<{ type: string; text: string }>;
  [key: string]: unknown;
}

// ============================================================================
// Kiro Agent Types
// ============================================================================

export interface SpecGenerationRequest {
  opportunityId: string;
  title: string;
  description: string;
  evidence: Evidence;
}

export interface SpecGenerationResponse {
  specUrl: string;
  generatedAt: string;
}

