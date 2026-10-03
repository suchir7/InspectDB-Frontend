export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'none' | 'info';

export type ReportStatus = 'passed' | 'action_required' | 'in_review' | 'failed' | 'draft';

export type InspectionCategory = 
  | 'Electrical'
  | 'Fire Safety'
  | 'Structural'
  | 'HVAC'
  | 'Equipment'
  | 'Environmental'
  | 'General';

// User & Authentication Types (Neon PostgreSQL Persistence)
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface Issue {
  issue_id?: string;
  title: string;
  severity: SeverityLevel;
  code_reference?: string;
  status: 'open' | 'in_progress' | 'resolved';
  notes?: string;
}

export interface Finding {
  finding_id?: string;
  category: string;
  severity: SeverityLevel;
  description: string;
  location_details?: string;
  issues: Issue[];
  custom_metrics?: Record<string, any>;
}

export interface CustomField {
  key: string;
  value: any;
  field_type: 'string' | 'number' | 'boolean' | 'json' | 'date';
}

export interface InspectionReport {
  id: string;
  title: string;
  inspector_name: string;
  location: string;
  inspection_date: string;
  category: string;
  status: ReportStatus;
  overall_severity: SeverityLevel;
  description?: string;
  findings: Finding[];
  custom_fields?: CustomField[];
  dynamic_attributes?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  is_sample?: boolean;
}

export interface ReportCreateInput {
  title: string;
  inspector_name: string;
  location: string;
  inspection_date: string;
  category: string;
  status: ReportStatus;
  overall_severity: SeverityLevel;
  description?: string;
  findings: Finding[];
  custom_fields?: CustomField[];
  dynamic_attributes?: Record<string, any>;
}

export interface ReportListResponse {
  total: number;
  page: number;
  limit: number;
  reports: InspectionReport[];
}

export interface QueryCondition {
  field: string;
  operator: string;
  value: any;
  value_type: 'string' | 'number' | 'boolean' | 'array' | 'categorical' | 'date' | string;
  sub_conditions?: QueryCondition[];
}

export interface QueryRequest {
  match_type: 'and' | 'or' | 'not' | string;
  conditions: QueryCondition[];
  limit?: number;
}

export interface QueryResponse {
  total_matches: number;
  execution_time_ms: number;
  query_ast: {
    match_type: string;
    conditions: QueryCondition[];
    generated_mongo?: Record<string, any>;
  };
  mongo_equivalent_query: Record<string, any>;
  matched_reports: InspectionReport[];
  explanation: string;
  complexity?: string;
  nested_depth?: number;
}

export interface SchemaFieldInfo {
  path: string;
  display_name: string;
  field_type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'categorical' | 'date' | string;
  is_array: boolean;
  is_nested: boolean;
  is_variable_schema: boolean;
  occurrence_count: number;
  total_documents: number;
  example_value?: any;
}

export interface SchemaOverviewResponse {
  total_documents: number;
  nested_fields_count: number;
  arrays_count: number;
  fields: SchemaFieldInfo[];
  variable_schema_groups: string[];
}

export interface RawQueryRequest {
  query: Record<string, any>;
  limit?: number;
}

export interface RawQueryResponse {
  total_matches: number;
  execution_time_ms: number;
  query: Record<string, any>;
  matched_reports: InspectionReport[];
  is_valid: boolean;
  warnings: string[];
  complexity: string;
  nested_depth: number;
}

export interface ExplainQueryRequest {
  query: Record<string, any>;
  collection?: string;
}

export interface ExplainQueryResponse {
  summary: string;
  nested_paths: string[];
  uses_elem_match: boolean;
  complexity: string;
  explanation: string;
  index_recommendations: string[];
}

export interface SavedQuery {
  id: string;
  name: string;
  description: string;
  query: Record<string, any>;
  created_at: string;
  conditions?: QueryCondition[];
  match_type?: string;
}

export interface QueryHistoryItem {
  id: string;
  name: string;
  timestamp: string;
  query: Record<string, any>;
  total_matches: number;
  execution_time_ms: number;
  conditions?: QueryCondition[];
  match_type?: string;
}

export interface QueryPreset {
  id: string;
  name: string;
  description: string;
  complexity: 'Simple' | 'Moderate' | 'Complex' | 'Advanced';
  fields: string[];
  expected_path: string;
  explanation: string;
  match_type: 'and' | 'or' | 'not';
  conditions: QueryCondition[];
  raw_query?: Record<string, any>;
}

export interface DashboardStats {
  total_reports: number;
  high_severity_findings: number;
  reports_requiring_attention: number;
  completed_inspections: number;
  status_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  severity_distribution: Record<string, number>;
  is_demonstration: boolean;
  storage_mode?: string;
  aws_connected?: boolean;
  schema_fields_count?: number;
  nested_fields_count?: number;
  array_fields_count?: number;
  data_source?: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  environment: string;
  database: {
    type: string;
    status: string;
    cluster_cost_active: boolean;
    message: string;
    mode?: 'memory' | 'mongodb' | 'documentdb';
    connected?: boolean;
    database_name?: string;
    collection?: string;
  };
}

// AI Query Assistant & Compatibility Types
export interface CompatibilityIssue {
  feature: string;
  mongodb_supported: boolean;
  documentdb_supported: boolean;
  severity: 'error' | 'warning' | 'info' | string;
  message: string;
  alternative_available: boolean;
  suggested_alternative?: Record<string, any> | null;
  alternative_explanation?: string | null;
  source: string;
}

export interface BehavioralDifference {
  feature: string;
  mongodb_behavior: string;
  documentdb_behavior: string;
  impact: string;
  source: string;
}

export interface CompatibilityReport {
  status: 'COMPATIBLE' | 'PARTIALLY_COMPATIBLE' | 'INCOMPATIBLE' | 'BEHAVIOR_DIFFERENCE' | 'UNKNOWN' | string;
  documentdb_version: string;
  mongodb_supported: boolean;
  documentdb_supported: boolean;
  summary: string;
  issues: CompatibilityIssue[];
  warnings: string[];
  behavioral_differences: BehavioralDifference[];
  alternative_query?: Record<string, any> | null;
  alternative_explanation?: string | null;
  alternative_status?: string | null;
}

export interface MongoTestResult {
  status: 'success' | 'unavailable' | 'rejected' | 'error' | string;
  database: string;
  collection: string;
  operation: string;
  documents_matched: number;
  execution_time_ms: number;
  sample_results: Record<string, any>[];
  total_returned: number;
  max_results_limit: number;
  reason?: string | null;
  error_message?: string | null;
}

export interface AiQueryHistoryEntry {
  id: string;
  timestamp: string;
  user_request: string;
  generated_query: Record<string, any>;
  operation: string;
  mongo_execution_status: 'success' | 'unavailable' | 'rejected' | 'error' | string;
  mongo_execution_time_ms: number;
  documents_matched: number;
  documentdb_compatibility_status: 'COMPATIBLE' | 'PARTIALLY_COMPATIBLE' | 'INCOMPATIBLE' | 'BEHAVIOR_DIFFERENCE' | 'UNKNOWN' | string;
  detected_issues: string[];
  has_alternative: boolean;
}

export interface GenerateQueryRequest {
  question: string;
  target_version?: string;
  execute_local_test?: boolean;
  context?: Record<string, any>;
}

export interface CheckCompatibilityRequest {
  query: Record<string, any>;
  target_version?: string;
}

export interface TestLocalQueryRequest {
  query: Record<string, any>;
  operation?: string;
  collection?: string;
  target_version?: string;
}

export interface GenerateQueryResponse {
  query: Record<string, any> | null;
  collection: string;
  operation: string;
  explanation: string;
  is_validated: boolean;
  mongo_test_result?: MongoTestResult | null;
  compatibility?: CompatibilityReport | null;
  warnings: string[];
  error?: string | null;
  api_key_configured: boolean;
}

export interface AiServiceStatus {
  status: string;
  gemini_configured: boolean;
  model: string;
  supported_operations: string[];
  target_collection: string;
  target_engine: string;
  documentdb_target_version?: string;
  supported_documentdb_versions?: string[];
  local_mongodb_available?: boolean;
  storage_mode?: string;
  max_query_results?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  response?: GenerateQueryResponse;
  loading?: boolean;
  error?: string | null;
}

// AI Cost Optimizer & Deployment Advisor Types
export interface WorkloadInput {
  requests_per_day: number;
  read_percentage: number;
  write_percentage: number;
  avg_document_size_kb?: number;
  data_storage_gb: number;
  backup_retention_days: number;
  monthly_uptime_hours: number;
  environment_tier?: 'development' | 'demo' | 'production' | string;
  traffic_pattern: string;
  availability_tier: string;
  region: string;
  selected_deployment: string;
}

export interface CostBreakdown {
  compute_cost: number;
  storage_cost: number;
  io_cost: number;
  backup_cost: number;
  total_monthly_cost: number;
  currency: string;
  hourly_rate_effective: number;
  pricing_source: string;
  assumptions: string[];
  included_components: string[];
  excluded_components: string[];
}

export interface DeploymentOptionEstimate {
  id: string;
  name: string;
  instance_type: string;
  node_count: number;
  monthly_uptime_hours: number;
  high_availability: boolean;
  monthly_cost: number;
  breakdown: CostBreakdown;
  suitability: string;
  scalability: string;
  operational_complexity: string;
  pros: string[];
  cons: string[];
  recommended_for: string;
}

export interface Recommendation {
  id: string;
  title: string;
  category: 'compute' | 'scheduling' | 'storage' | 'architecture' | 'monitoring' | string;
  impact: 'high' | 'medium' | 'low' | string;
  explanation: string;
  proposed_action: string;
  reason?: string | null;
  estimated_impact?: string | null;
  tradeoff?: string | null;
  action?: string | null;
  estimated_monthly_savings?: number | null;
  trade_offs: string[];
  implementation_steps: string[];
  why_context?: Record<string, any>;
  status: 'pending' | 'applied' | 'dismissed' | string;
}

export interface CostHealth {
  current_cost: number;
  potential_optimization_percent: number;
  main_cost_driver: string;
  usage_pattern: string;
  health_summary: string;
  deterministic_insights: string[];
}

export interface CostEstimateResponse {
  workload: WorkloadInput;
  selected_deployment: DeploymentOptionEstimate;
  comparison_options: DeploymentOptionEstimate[];
  potential_monthly_savings: number;
  cost_health?: CostHealth | null;
  pricing_metadata: Record<string, any>;
}

export interface CostAnalysisRequest {
  workload: WorkloadInput;
  force_refresh?: boolean;
}

export interface CostAnalysisResult {
  analysis_id: string;
  timestamp: string;
  workload: WorkloadInput;
  selected_estimate: DeploymentOptionEstimate;
  comparison_options: DeploymentOptionEstimate[];
  potential_monthly_savings: number;
  cost_health?: CostHealth | null;
  cost_drivers: string[];
  identified_waste: string[];
  optimization_opportunities?: string[];
  deployment_observations?: string[];
  tradeoffs?: string[];
  risks?: string[];
  recommended_next_steps?: string[];
  gemini_summary: string;
  recommendations: Recommendation[];
  missing_information: string[];
  is_cached: boolean;
  is_demo_mode: boolean;
  gemini_model: string;
}

// AWS DocumentDB Cost Monitoring & Optimization Types
export interface CostTrendPoint {
  date: string;
  day_number: number;
  daily_cost: number;
  cumulative_cost: number;
  projected_monthly_cost: number;
  compute_cost: number;
  storage_cost: number;
  io_cost: number;
  backup_cost: number;
}

export interface CostTrendResponse {
  timeframe: '7d' | '30d' | '90d' | string;
  current_daily_cost: number;
  projected_monthly_cost: number;
  points: CostTrendPoint[];
  assumptions: string;
}

export interface CostDriverDetail {
  driver_name: string;
  current_value: string;
  monthly_cost_contribution: number;
  percentage_of_total: number;
  impact_level: 'High' | 'Medium' | 'Low' | string;
  optimization_opportunity: string;
  potential_savings: number;
}

export interface CostAnomalyReport {
  has_anomaly: boolean;
  change_direction: 'increase' | 'decrease' | 'stable' | string;
  change_percent: number;
  dollar_difference: number;
  baseline_cost: number;
  current_cost: number;
  contributing_factors: string[];
  severity: 'info' | 'warning' | 'critical' | string;
  detected_rule: string;
}

export interface BudgetStatus {
  monthly_threshold: number;
  current_estimate: number;
  remaining_budget: number;
  utilization_percent: number;
  status: 'within' | 'near' | 'exceeded' | string;
}

export interface CostMonitoringSnapshot {
  snapshot_id: string;
  timestamp: string;
  title: string;
  workload: WorkloadInput;
  deployment_tier: string;
  monthly_cost: number;
  daily_cost: number;
  breakdown: CostBreakdown;
  drivers: CostDriverDetail[];
  optimization_opportunity_percent: number;
}

export interface CostComparisonReport {
  baseline_title: string;
  current_title: string;
  baseline_cost: number;
  current_cost: number;
  cost_difference: number;
  percentage_difference: number;
  breakdown_diff: Record<string, number>;
  deterministic_reasons: string[];
  gemini_explanation?: string | null;
}

export interface OptimizationSimulationRequest {
  current_workload: WorkloadInput;
  proposed_uptime_hours?: number;
  proposed_storage_gb?: number;
  proposed_deployment?: string;
  proposed_backup_days?: number;
}

export interface OptimizationSimulationResponse {
  current_cost: number;
  simulated_cost: number;
  dollar_difference: number;
  percentage_savings: number;
  explanation: string;
  tradeoffs: string[];
  simulated_breakdown: CostBreakdown;
}

export interface CostMonitoringAnalysisRequest {
  current_workload: WorkloadInput;
  baseline_workload?: WorkloadInput | null;
  threshold?: number;
  force_refresh?: boolean;
}

export interface CostMonitoringAnalysisResponse {
  analysis_id: string;
  timestamp: string;
  summary: string;
  current_monthly_cost: number;
  daily_cost: number;
  projected_monthly_cost: number;
  optimization_opportunity_percent: number;
  budget_status: BudgetStatus;
  breakdown: CostBreakdown;
  top_cost_drivers: CostDriverDetail[];
  anomaly_detection: CostAnomalyReport;
  cost_drivers: string[];
  changes_detected: string[];
  optimization_opportunities: Array<{
    title: string;
    reason: string;
    impact: string;
    tradeoff: string;
    action: string;
    suggested_change?: string;
    priority?: string;
  }>;
  deployment_considerations: string[];
  risks: string[];
  recommended_actions: Array<{
    step: number;
    action: string;
    rationale: string;
  }>;
  is_ai_powered: boolean;
  pricing_assumptions: Record<string, any>;
}

export interface CostAlertConfig {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  triggerCondition: string;
}
