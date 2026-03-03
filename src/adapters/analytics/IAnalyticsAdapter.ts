/**
 * Analytics Adapter Interface
 * 
 * All analytics provider integrations must implement this interface.
 * This enables OpportunityOS to work with any analytics provider
 * (Userpilot, PostHog, Amplitude, Mixpanel, etc.) through a common contract.
 */

import { DateRange, FunnelData, NPSData, FeatureUsageData, CustomQuery, EventData } from '../../types';

/**
 * Interface for analytics provider adapters.
 * 
 * All analytics integrations must implement this interface to ensure
 * compatibility with the OpportunityOS Detection Engine.
 * 
 * Adapters should:
 * - Return empty arrays for unsupported data types rather than throwing errors
 * - Normalize provider-specific data to the standard types (FunnelData, NPSData, FeatureUsageData)
 * - Handle errors gracefully with retry logic for transient failures
 * - Accept optional date ranges to filter data by time period
 */
export interface IAnalyticsAdapter {
  /**
   * Fetch funnel data from the analytics provider.
   * 
   * Funnels represent multi-step user flows where each step has a user count
   * and dropoff rate. This data is used to detect funnel drop opportunities.
   * 
   * @param dateRange Optional date range for filtering funnel data.
   *                  If not provided, the adapter should use provider-specific defaults.
   * @returns Promise resolving to an array of normalized funnel data.
   *          Returns empty array if the provider doesn't support funnels.
   */
  getFunnels(dateRange?: DateRange): Promise<FunnelData[]>;

  /**
   * Fetch NPS (Net Promoter Score) survey data from the analytics provider.
   * 
   * NPS data includes the overall score, response count, and individual responses
   * categorized as detractors, passives, or promoters. This data is used to detect
   * low NPS opportunities.
   * 
   * @param dateRange Optional date range for filtering NPS data.
   *                  If not provided, the adapter should use provider-specific defaults.
   * @returns Promise resolving to an array of normalized NPS data.
   *          Returns empty array if the provider doesn't support NPS surveys.
   */
  getNPS(dateRange?: DateRange): Promise<NPSData[]>;

  /**
   * Fetch feature usage data from the analytics provider.
   * 
   * Feature usage data shows how many users are actively using specific features
   * compared to the total user base. This data is used to detect feature underuse
   * opportunities.
   * 
   * @param dateRange Optional date range for filtering feature usage data.
   *                  If not provided, the adapter should use provider-specific defaults.
   * @returns Promise resolving to an array of normalized feature usage data.
   *          Returns empty array if the provider doesn't support feature tracking.
   */
  getFeatureUsage(dateRange?: DateRange): Promise<FeatureUsageData[]>;

  /**
   * Optional method for fetching raw events with custom queries.
   * 
   * This method allows for provider-specific queries that don't fit the standard
   * funnel/NPS/feature usage patterns. The query structure is flexible and defined
   * by each adapter based on the provider's API capabilities.
   * 
   * Providers that don't support custom event queries should not implement this method.
   * 
   * @param query Provider-specific query structure for fetching raw events.
   * @returns Promise resolving to an array of raw event data.
   */
  getRawEvents?(query: CustomQuery): Promise<EventData[]>;
}
