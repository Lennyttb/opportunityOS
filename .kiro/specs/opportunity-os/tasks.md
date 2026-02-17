# Implementation Plan: OpportunityOS

## Overview

OpportunityOS will be implemented as a TypeScript NPM package with a modular architecture. The implementation follows a bottom-up approach: core utilities and types first, then data layer, business logic, external integrations, CLI, and finally testing. Each major component includes property-based tests to validate correctness properties from the design document.

## Tasks

- [ ] 1. Initialize NPM package and project structure
  - Create package.json with TypeScript, Node.js 18+ requirement, and dependencies (axios, @slack/bolt, node-cron, dotenv, fast-check, jest)
  - Set up TypeScript configuration with strict mode and ES2020 target
  - Create directory structure: src/{core,ingestion,detection,scoring,storage,slack,kiro,feedback,cli,utils}
  - Set up Jest with TypeScript support for testing
  - Create .gitignore for node_modules, dist, .env files
  - _Requirements: 8.1, 8.2, 8.7, 8.8_

- [ ] 2. Implement core types and configuration management
  - [ ] 2.1 Define TypeScript interfaces for all data models
    - Create types for Opportunity, AnalyticsData, Config, and all metric types
    - Define OpportunityStatus, DetectionMethod, and MetricType enums
    - Implement ID generation function with crypto.randomBytes
    - _Requirements: 5.5, 11.1_
  
  - [ ] 2.2 Implement ConfigurationManager
    - Load configuration from environment variables using dotenv
    - Validate required fields (USERPILOT_API_KEY, SLACK_BOT_TOKEN, KIRO_WEBHOOK_URL, CRON_SCHEDULE, OPPORTUNITY_THRESHOLD)
    - Provide default scoring weights that sum to 1.0
    - Validate scoring weights are positive numbers
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
  
  - [ ]* 2.3 Write property test for configuration validation
    - **Property 15: Configuration Validation**
    - **Validates: Requirements 6.2, 6.4, 6.5**
  
  - [ ]* 2.4 Write property test for scoring weight constraints
    - **Property 16: Scoring Weight Constraints**
    - **Validates: Requirements 6.6, 6.7, 6.8**
  
  - [ ] 2.5 Write unit tests for configuration edge cases
    - Test missing required variables
    - Test optional GitHub token handling
    - Test invalid cron expressions
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [ ] 3. Implement logging and error handling utilities
  - [ ] 3.1 Create Logger utility with configurable log levels
    - Support debug, info, warn, error levels
    - Include timestamp, component name, message, and context in logs
    - Support external logging service integration
    - Log configuration on startup (excluding sensitive credentials)
    - _Requirements: 9.1, 9.2, 9.5, 9.6, 9.7_
  
  - [ ] 3.2 Implement retry utility with exponential backoff
    - Base delay 1s, max delay 30s, max 3 attempts
    - Log each retry attempt with retry count
    - _Requirements: 1.6, 9.3_
  
  - [ ] 3.3 Implement critical error alerting
    - Post alerts to Slack for authentication failures, data corruption, system crashes
    - Format alerts with component, error message, timestamp, and suggested action
    - _Requirements: 9.4_
  
  - [ ]* 3.4 Write property test for error logging completeness
    - **Property 22: Error Logging Completeness**
    - **Validates: Requirements 9.1, 9.2**
  
  - [ ] 3.5 Write property test for API retry with exponential backoff
    - **Property 2: API Retry with Exponential Backoff**
    - **Validates: Requirements 1.6, 9.3**
  
  - [ ]* 3.6 Write property test for log level filtering
    - **Property 24: Log Level Filtering**
    - **Validates: Requirements 9.5**

- [ ] 4. Implement OpportunityStore for data persistence
  - [ ] 4.1 Create OpportunityStore with JSON file storage
    - Implement save, findById, findByStatus, findByDateRange, updateStatus, query methods
    - Store opportunities as individual JSON files: {storePath}/{id}.json
    - Implement file locking for concurrent access prevention
    - Create and maintain index.json for fast queries
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ] 4.2 Implement JSON serialization with validation
    - Validate all required fields are present before serialization
    - Validate JSON structure against Opportunity schema on deserialization
    - Handle deserialization errors gracefully (log and skip invalid records)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ]* 4.3 Write property test for serialization round trip
    - **Property 31: Serialization Round Trip**
    - **Validates: Requirements 11.1, 11.2**
  
  - [ ]* 4.4 Write property test for opportunity storage completeness
    - **Property 13: Opportunity Storage Completeness**
    - **Validates: Requirements 5.5, 11.1, 11.2**
  
  - [ ]* 4.5 Write property test for query filter correctness
    - **Property 14: Query Filter Correctness**
    - **Validates: Requirements 5.6**
  
  - [ ]* 4.6 Write property test for opportunity persistence with status
    - **Property 12: Opportunity Persistence with Status**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
  
  - [ ] 4.7 Write unit tests for storage edge cases
    - Test concurrent access prevention
    - Test corrupted JSON handling
    - Test file system permission errors
    - _Requirements: 11.5_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Data Ingestion Layer
  - [ ] 6.1 Create DataIngestionLayer with Userpilot API integration
    - Implement fetchAnalytics with axios HTTP client
    - Configure timeout and retry logic
    - Handle rate limiting (429 status codes)
    - Fetch feature usage, funnel dropoffs, path analysis, NPS scores, segment engagement
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ] 6.2 Implement data normalization
    - Transform Userpilot API responses into AnalyticsData format
    - Validate API responses against expected schema
    - Preserve all required metric types
    - _Requirements: 1.5_
  
  - [ ] 6.3 Implement error handling for API failures
    - Return descriptive error messages for authentication failures
    - Log request/response details for all API interactions
    - _Requirements: 1.7, 9.2_
  
  - [ ] 6.4 Write property test for data normalization
    - **Property 1: Data Normalization Preserves Required Fields**
    - **Validates: Requirements 1.4, 1.5**
  
  - [ ] 6.5 Write unit tests for ingestion triggers
    - Test cron trigger initiates fetch
    - Test webhook trigger initiates fetch
    - Test manual Slack command initiates fetch
    - Test authentication failure error message
    - _Requirements: 1.1, 1.2, 1.3, 1.7_

- [ ] 7. Implement Opportunity Detection Agent
  - [ ] 7.1 Create detection algorithms
    - Implement detectDropoffs: identify funnel steps with dropoff rate >30%
    - Implement detectFriction: identify paths with avgTimeToComplete >2x median or abandonmentRate >25%
    - Implement detectUnderutilization: identify features with usageRate <10%
    - Implement detectSegmentVariance: identify segments with >50% variance from mean
    - Implement clusterComplaints: group NPS feedback by keyword similarity, identify clusters >10 mentions
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ] 7.2 Implement detectOpportunities orchestrator
    - Run all detection algorithms on AnalyticsData
    - Aggregate detected opportunities from all methods
    - Include all required fields in DetectedOpportunity objects
    - _Requirements: 2.8_
  
  - [ ] 7.3 Write property test for opportunity detection completeness
    - **Property 3: Opportunity Detection Completeness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
  
  - [ ] 7.4 Write property test for detected opportunity completeness
    - **Property 5: Detected Opportunity Completeness**
    - **Validates: Requirements 2.8**

- [ ] 8. Implement Scoring Engine
  - [ ] 8.1 Create scoring calculation methods
    - Implement estimateImpact: affectedUsers / totalUsers normalized to 0-100
    - Implement estimateSeverity: based on dropoffRate or abandonmentRate, 0-100
    - Implement estimateRevenue: estimated revenue impact, 0-100
    - Implement estimateEffort: heuristic based on affected components, 1-100
    - Implement calculateConfidence: based on sample size and data recency, 0-100
    - _Requirements: 2.6_
  
  - [ ] 8.2 Implement calculateScore with configurable weights
    - Apply formula: (impactScore × impactWeight + severityScore × severityWeight + revenueScore × revenueWeight) ÷ (effortScore × effortWeight)
    - Use configured weights from ScoringConfig
    - Return ScoredOpportunity with all score components
    - _Requirements: 2.6, 2.7_
  
  - [ ]* 8.3 Write property test for scoring formula correctness
    - **Property 4: Scoring Formula Correctness**
    - **Validates: Requirements 2.6, 2.7**

- [ ] 9. Implement Slack Bot integration
  - [ ] 9.1 Create SlackBot with @slack/bolt framework
    - Initialize bot with token and channel configuration
    - Implement socket mode for local development
    - Handle rate limiting (1 message per second)
    - _Requirements: 3.1_
  
  - [ ] 9.2 Implement opportunity posting
    - Format opportunities as Slack Block Kit messages
    - Include all required fields: title, segment, affectedUsers, scores, components
    - Add interactive buttons: Promote, Dismiss, Investigate, Request Data
    - Store message timestamps for updates
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 9.3 Implement interaction handlers
    - Handle "Promote to Spec" button: update status to "approved", trigger Kiro
    - Handle "Dismiss" button: update status to "dismissed"
    - Handle "Investigate Further" button: update status to "investigating"
    - Handle "Request More Data" button: trigger additional data collection
    - _Requirements: 3.4, 3.5, 3.6, 3.7_
  
  - [ ] 9.4 Implement Slack retry logic
    - Retry failed posts up to 3 times with exponential backoff
    - Log each retry attempt
    - _Requirements: 3.8_
  
  - [ ]* 9.5 Write property test for threshold-based filtering
    - **Property 6: Threshold-Based Filtering**
    - **Validates: Requirements 2.9, 3.1**
  
  - [ ] 9.6 Write property test for Slack message completeness
    - **Property 7: Slack Message Completeness**
    - **Validates: Requirements 3.2, 3.3**
  
  - [ ] 9.7 Write property test for Slack interaction state transitions
    - **Property 8: Slack Interaction State Transitions**
    - **Validates: Requirements 3.4, 3.5, 3.6, 3.7**
  
  - [ ] 9.8 Write property test for Slack retry logic
    - **Property 9: Slack Retry Logic**
    - **Validates: Requirements 3.8**

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement Kiro Bridge
  - [ ] 11.1 Create KiroBridge with webhook integration
    - Implement sendToKiro with axios POST to webhook URL
    - Set timeout to 60 seconds
    - Retry on network errors but not on 4xx responses
    - _Requirements: 4.1_
  
  - [ ] 11.2 Implement payload transformation
    - Format opportunity data into KiroPayload structure
    - Extract requirements from description and metrics
    - Map affected components to technical constraints
    - Generate success metrics from opportunity scores
    - _Requirements: 4.2_
  
  - [ ] 11.3 Implement error handling
    - Log full request/response for debugging
    - Notify user in Slack on Kiro integration failure
    - _Requirements: 4.8_
  
  - [ ] 11.4 Write property test for Kiro payload completeness
    - **Property 10: Kiro Payload Completeness**
    - **Validates: Requirements 4.1, 4.2**
  
  - [ ] 11.5 Write property test for Kiro integration error handling
    - **Property 11: Kiro Integration Error Handling**
    - **Validates: Requirements 4.8**

- [ ] 12. Implement Feedback Loop
  - [ ] 12.1 Create FeedbackLoop with post-release data collection
    - Fetch post-release analytics from Userpilot API for affected segments/components
    - Calculate actual impact metrics: dropoff change, NPS change, usage change
    - _Requirements: 7.1, 7.2_
  
  - [ ] 12.2 Implement comparison and accuracy calculation
    - Compare predicted vs actual metrics
    - Calculate accuracy percentages for each metric type
    - Calculate overall accuracy score
    - _Requirements: 7.3_
  
  - [ ] 12.3 Implement weight adjustment algorithm
    - Calculate prediction error for each component
    - Adjust weights proportionally with learning rate 0.1
    - Ensure adjusted weights sum to 1.0
    - Only adjust after 10+ comparisons
    - _Requirements: 7.4_
  
  - [ ] 12.4 Implement result persistence and notification
    - Store comparison results with opportunity record
    - Post summary to Slack channel with accuracy metrics
    - _Requirements: 7.5, 7.6_
  
  - [ ] 12.5 Write property test for feedback loop data collection
    - **Property 17: Feedback Loop Data Collection**
    - **Validates: Requirements 7.1, 7.2**
  
  - [ ] 12.6 Write property test for prediction accuracy comparison
    - **Property 18: Prediction Accuracy Comparison**
    - **Validates: Requirements 7.3**
  
  - [ ]* 12.7 Write property test for weight adjustment on deviation
    - **Property 19: Weight Adjustment on Deviation**
    - **Validates: Requirements 7.4**
  
  - [ ] 12.8 Write property test for feedback loop persistence and notification
    - **Property 20: Feedback Loop Persistence and Notification**
    - **Validates: Requirements 7.5, 7.6**

- [ ] 13. Implement Cron Scheduler
  - [ ] 13.1 Create CronScheduler with node-cron
    - Implement start method with schedule and task function
    - Implement mutex lock to prevent concurrent execution
    - Log start/end times and execution duration
    - Handle task errors without stopping scheduler
    - Support graceful shutdown on SIGTERM/SIGINT
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 13.2 Implement cron expression validation
    - Validate standard cron expression syntax (5 or 6 fields)
    - Return descriptive errors for invalid expressions
    - _Requirements: 10.6_
  
  - [ ]* 13.3 Write property test for cron schedule execution
    - **Property 26: Cron Schedule Execution**
    - **Validates: Requirements 10.1, 10.2**
  
  - [ ] 13.4 Write property test for scheduled run completion logging
    - **Property 27: Scheduled Run Completion Logging**
    - **Validates: Requirements 10.3**
  
  - [ ] 13.5 Write property test for scheduler error resilience
    - **Property 28: Scheduler Error Resilience**
    - **Validates: Requirements 10.4**
  
  - [ ]* 13.6 Write property test for concurrent execution prevention
    - **Property 29: Concurrent Execution Prevention**
    - **Validates: Requirements 10.5**
  
  - [ ]* 13.7 Write property test for cron expression parsing
    - **Property 30: Cron Expression Parsing**
    - **Validates: Requirements 10.6**

- [ ] 14. Implement CLI entry points
  - [ ] 14.1 Create CLI with commander.js
    - Implement init command: initialize configuration
    - Implement detect command: run detection once
    - Implement start command: start scheduled detection
    - Implement bot command: start Slack bot
    - Implement feedback command: run feedback loop for opportunity ID
    - Implement list command: query opportunities with filters
    - Add --test-mode flag for all commands
    - Add --help for all commands
    - _Requirements: 8.3, 8.4, 8.5_
  
  - [ ] 14.2 Implement argument validation and error handling
    - Validate arguments before execution
    - Provide helpful error messages
    - Exit with appropriate status codes
    - _Requirements: 8.3, 8.4, 8.5_
  
  - [ ] 14.3 Write property test for CLI command availability
    - **Property 21: CLI Command Availability**
    - **Validates: Requirements 8.3, 8.4, 8.5**
  
  - [ ] 14.4 Write unit tests for CLI commands
    - Test each command with valid arguments
    - Test --help flag for all commands
    - Test --test-mode flag
    - _Requirements: 8.3, 8.4, 8.5_

- [ ] 15. Implement test mode with mock services
  - [ ] 15.1 Create mock implementations
    - MockUserpilotAPI: generate realistic mock analytics data
    - MockSlackBot: log interactions without posting to real Slack
    - MockKiroBridge: return mock success responses
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ] 15.2 Implement mock data generation
    - Generate opportunities with varied scores (20-95 range)
    - Generate different segments (at least 3)
    - Generate different detection methods
    - _Requirements: 12.4_
  
  - [ ] 15.3 Implement test mode action logging
    - Log all actions with "TEST MODE" prefix
    - Include all parameters that would be used in production
    - _Requirements: 12.5_
  
  - [ ] 15.4 Write property test for test mode mock data generation
    - **Property 34: Test Mode Mock Data Generation**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**
  
  - [ ] 15.5 Write property test for test mode action logging
    - **Property 35: Test Mode Action Logging**
    - **Validates: Requirements 12.5**
  
  - [ ] 15.6 Write unit tests for test mode behavior
    - Test no real API calls are made in test mode
    - Test mock data is realistic
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Create documentation and package metadata
  - [ ] 17.1 Write README.md
    - Installation instructions
    - Configuration guide with all environment variables
    - Usage examples for all CLI commands
    - Architecture overview
    - Testing instructions
    - _Requirements: 8.6_
  
  - [ ] 17.2 Write additional documentation
    - Create CONTRIBUTING.md with development setup
    - Create API.md with component interfaces
    - Create CHANGELOG.md for version tracking
    - _Requirements: 8.6_
  
  - [ ] 17.3 Finalize package.json
    - Set name, version, description, author, license
    - Configure bin entries for CLI commands
    - Set main and types entries
    - Add scripts: build, test, lint
    - Verify Node.js version requirement
    - _Requirements: 8.1, 8.2, 8.7, 8.8_
  
  - [ ] 17.4 Write unit tests for package structure
    - Test README.md exists with required sections
    - Test TypeScript definitions are included
    - Test Node.js version is specified
    - Test all dependencies are listed
    - _Requirements: 8.2, 8.6, 8.7, 8.8_

- [ ] 18. Integration and end-to-end wiring
  - [ ] 18.1 Wire all components together
    - Create main orchestrator that connects ingestion → detection → scoring → storage → Slack
    - Implement approval flow: Slack → Kiro bridge
    - Implement feedback flow: implementation → analytics → weight adjustment
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 7.1_
  
  - [ ] 18.2 Implement graceful error handling across components
    - Ensure failures in one component don't crash the system
    - Implement graceful degradation strategies
    - _Requirements: 9.1, 9.4_
  
  - [ ] 18.3 Write integration tests
    - Test full pipeline: ingestion → detection → Slack posting
    - Test approval flow: Slack interaction → Kiro call
    - Test feedback flow: post-release → weight adjustment
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 7.1_

- [ ] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and error conditions
- All property tests should run with minimum 100 iterations
- Test mode enables development and testing without external service dependencies
