import {
  InspectionReport,
  ReportCreateInput,
  ReportListResponse,
  QueryRequest,
  QueryResponse,
  DashboardStats,
  HealthStatus,
  GenerateQueryRequest,
  GenerateQueryResponse,
  AiServiceStatus,
  WorkloadInput,
  CostEstimateResponse,
  CostAnalysisRequest,
  CostAnalysisResult,
  SchemaOverviewResponse,
  RawQueryRequest,
  RawQueryResponse,
  ExplainQueryRequest,
  ExplainQueryResponse,
  CostTrendResponse,
  CostDriverDetail,
  CostAnomalyReport,
  CostMonitoringSnapshot,
  CostComparisonReport,
  OptimizationSimulationRequest,
  OptimizationSimulationResponse,
  CostMonitoringAnalysisRequest,
  CostMonitoringAnalysisResponse,
  UserProfile,
  AuthResponse,
  RegisterInput,
  LoginInput,
  MongoTestResult
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

const TOKEN_KEY = 'inspectdb_auth_token';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage quota error
  }
}

function getAuthHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...customHeaders };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      } else if (errJson.message) {
        errorMsg = errJson.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new ApiError(errorMsg, response.status);
  }
  return response.json();
}

export const api = {
  // Token Management
  getToken(): string | null {
    return getStoredToken();
  },
  setToken(token: string | null): void {
    setStoredToken(token);
  },

  // Authentication Endpoints (Neon PostgreSQL)
  async register(input: RegisterInput): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    const data = await handleResponse<AuthResponse>(res);
    if (data.access_token) {
      setStoredToken(data.access_token);
    }
    return data;
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    const data = await handleResponse<AuthResponse>(res);
    if (data.access_token) {
      setStoredToken(data.access_token);
    }
    return data;
  },

  async getCurrentUser(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse<UserProfile>(res);
  },

  async logout(): Promise<{ message: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return await handleResponse<{ message: string }>(res);
    } finally {
      setStoredToken(null);
    }
  },

  // Inspection Reports & Core Data
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE_URL}/health`, {
      headers: getAuthHeaders()
    });
    return handleResponse<HealthStatus>(res);
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE_URL}/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse<DashboardStats>(res);
  },

  async getReports(params?: {
    search?: string;
    category?: string;
    status?: string;
    severity?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    limit?: number;
  }): Promise<ReportListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category && params.category !== 'all') query.append('category', params.category);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.severity && params.severity !== 'all') query.append('severity', params.severity);
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    if (params?.sort_order) query.append('sort_order', params.sort_order);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const url = `${API_BASE_URL}/reports${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse<ReportListResponse>(res);
  },

  async getReportById(reportId: string): Promise<InspectionReport> {
    const res = await fetch(`${API_BASE_URL}/reports/${encodeURIComponent(reportId)}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<InspectionReport>(res);
  },

  async createReport(input: ReportCreateInput): Promise<InspectionReport> {
    const res = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(input)
    });
    return handleResponse<InspectionReport>(res);
  },

  async updateReport(reportId: string, input: Partial<ReportCreateInput>): Promise<InspectionReport> {
    const res = await fetch(`${API_BASE_URL}/reports/${encodeURIComponent(reportId)}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(input)
    });
    return handleResponse<InspectionReport>(res);
  },

  async deleteReport(reportId: string): Promise<{ message: string; report_id: string }> {
    const res = await fetch(`${API_BASE_URL}/reports/${encodeURIComponent(reportId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string; report_id: string }>(res);
  },

  async executeNestedQuery(queryReq: QueryRequest): Promise<QueryResponse> {
    const res = await fetch(`${API_BASE_URL}/query`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(queryReq)
    });
    return handleResponse<QueryResponse>(res);
  },

  async getDocumentSchema(): Promise<SchemaOverviewResponse> {
    const res = await fetch(`${API_BASE_URL}/query/schema`, {
      headers: getAuthHeaders()
    });
    return handleResponse<SchemaOverviewResponse>(res);
  },

  async executeRawQuery(rawReq: RawQueryRequest): Promise<RawQueryResponse> {
    const res = await fetch(`${API_BASE_URL}/query/raw`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(rawReq)
    });
    return handleResponse<RawQueryResponse>(res);
  },

  async explainQuery(request: ExplainQueryRequest): Promise<ExplainQueryResponse> {
    const res = await fetch(`${API_BASE_URL}/query/explain`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(request)
    });
    return handleResponse<ExplainQueryResponse>(res);
  },

  // AI Query Assistant APIs
  async generateAiQuery(request: GenerateQueryRequest): Promise<GenerateQueryResponse> {
    const res = await fetch(`${API_BASE_URL}/ai/generate-query`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(request)
    });
    return handleResponse<GenerateQueryResponse>(res);
  },

  async testLocalQuery(request: { query: Record<string, any>; operation?: string; collection?: string; target_version?: string }): Promise<{ mongo_test_result: MongoTestResult; compatibility: any }> {
    const res = await fetch(`${API_BASE_URL}/ai/test-local-query`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(request)
    });
    return handleResponse<{ mongo_test_result: MongoTestResult; compatibility: any }>(res);
  },

  async checkQueryCompatibility(request: { query: Record<string, any>; target_version?: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/ai/compatibility`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(request)
    });
    return handleResponse<any>(res);
  },

  async getAiStatus(): Promise<AiServiceStatus> {
    const res = await fetch(`${API_BASE_URL}/ai/status`, {
      headers: getAuthHeaders()
    });
    return handleResponse<AiServiceStatus>(res);
  },

  // AI Cost Optimizer & Deployment Advisor APIs
  async calculateCostEstimate(workload: WorkloadInput): Promise<CostEstimateResponse> {
    const res = await fetch(`${API_BASE_URL}/cost/estimate`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(workload)
    });
    return handleResponse<CostEstimateResponse>(res);
  },

  async analyzeCostAndDeployment(request: CostAnalysisRequest): Promise<CostAnalysisResult> {
    const res = await fetch(`${API_BASE_URL}/cost/analyze`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(request)
    });
    return handleResponse<CostAnalysisResult>(res);
  },

  async getCostAnalysisHistory(): Promise<CostAnalysisResult[]> {
    const res = await fetch(`${API_BASE_URL}/cost/history`, {
      headers: getAuthHeaders()
    });
    return handleResponse<CostAnalysisResult[]>(res);
  },

  async updateRecommendationStatus(recId: string, status: 'pending' | 'applied' | 'dismissed'): Promise<{ message: string; id: string; status: string }> {
    const res = await fetch(`${API_BASE_URL}/cost/recommendations/${encodeURIComponent(recId)}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status })
    });
    return handleResponse<{ message: string; id: string; status: string }>(res);
  },

  async clearCostHistory(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/cost/history`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  // AWS DocumentDB Cost Monitoring APIs
  async getCostTrend(workload: WorkloadInput, timeframe: '7d' | '30d' | '90d' = '30d'): Promise<CostTrendResponse> {
    const res = await fetch(`${API_BASE_URL}/cost/monitoring/trend`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ workload, timeframe })
    });
    return handleResponse<CostTrendResponse>(res);
  },

  async getCostDrivers(workload: WorkloadInput): Promise<CostDriverDetail[]> {
    const res = await fetch(`${API_BASE_URL}/cost/monitoring/drivers`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(workload)
    });
    return handleResponse<CostDriverDetail[]>(res);
  },

  async checkCostAnomalies(request: CostMonitoringAnalysisRequest): Promise<CostAnomalyReport> {
    const res = await fetch(`${API_BASE_URL}/cost/monitoring/anomalies`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(request)
    });
    return handleResponse<CostAnomalyReport>(res);
  },

  async simulateOptimization(request: OptimizationSimulationRequest): Promise<OptimizationSimulationResponse> {
    const res = await fetch(`${API_BASE_URL}/cost/monitoring/simulate`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(request)
    });
    return handleResponse<OptimizationSimulationResponse>(res);
  },

  async analyzeCostMonitoring(request: CostMonitoringAnalysisRequest): Promise<CostMonitoringAnalysisResponse> {
    const res = await fetch(`${API_BASE_URL}/cost/monitoring/analyze`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(request)
    });
    return handleResponse<CostMonitoringAnalysisResponse>(res);
  },

  async getMonitoringSnapshots(): Promise<CostMonitoringSnapshot[]> {
    const res = await fetch(`${API_BASE_URL}/cost/monitoring/snapshots`, {
      headers: getAuthHeaders()
    });
    return handleResponse<CostMonitoringSnapshot[]>(res);
  },

  async createMonitoringSnapshot(title: string, workload: WorkloadInput): Promise<CostMonitoringSnapshot> {
    const res = await fetch(`${API_BASE_URL}/cost/monitoring/snapshots`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title, workload })
    });
    return handleResponse<CostMonitoringSnapshot>(res);
  },

  async deleteMonitoringSnapshot(snapshotId: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/cost/monitoring/snapshots/${encodeURIComponent(snapshotId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  async compareSnapshots(baselineSnapshotId: string, currentSnapshotId: string): Promise<CostComparisonReport> {
    const res = await fetch(`${API_BASE_URL}/cost/monitoring/compare`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        baseline_snapshot_id: baselineSnapshotId,
        current_snapshot_id: currentSnapshotId
      })
    });
    return handleResponse<CostComparisonReport>(res);
  }
};
