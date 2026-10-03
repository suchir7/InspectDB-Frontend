import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  AlertOctagon,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
  Layers,
  Sparkles,
  RefreshCw,
  SearchCode,
  Database,
  Zap,
  ShieldAlert,
  Wrench,
  Flame,
  Building2,
  Thermometer,
  Boxes,
  FileCode,
  ChevronRight,
  DollarSign,
  Copy,
  Check,
  Server,
  Info,
  Sliders,
  FolderOpen
} from 'lucide-react';
import { api } from '../services/api';
import { InspectionReport, DashboardStats, SchemaOverviewResponse } from '../types';
import { StatusBadge, SeverityBadge } from '../components/common/Badge';

interface DomainCardInfo {
  name: string;
  categoryKey: string;
  icon: React.ReactNode;
  color: string;
  bgLight: string;
  borderColor: string;
  telemetryKey: string;
  sampleFields: string[];
  description: string;
}

const DOMAIN_CATALOG: DomainCardInfo[] = [
  {
    name: 'Electrical Grid & Power',
    categoryKey: 'Electrical',
    icon: <Zap size={18} />,
    color: '#d97706',
    bgLight: '#fffbeb',
    borderColor: '#fde68a',
    telemetryKey: 'electrical_telemetry',
    sampleFields: ['phases.phase_a.voltage_kv', 'current_amps', 'frequency_hz', 'harmonics_thd_pct'],
    description: 'High-voltage substations, transformers, phase harmonics & thermal loads'
  },
  {
    name: 'Fire Safety & Life Protection',
    categoryKey: 'Fire Safety',
    icon: <Flame size={18} />,
    color: '#dc2626',
    bgLight: '#fee2e2',
    borderColor: '#fecaca',
    telemetryKey: 'fire_safety_data',
    sampleFields: ['suppression_system', 'alarm_panel_status', 'extinguisher_count', 'egress_routes'],
    description: 'Commercial high-rises, emergency egress, suppression valves & smoke sensors'
  },
  {
    name: 'Industrial Heavy Machinery',
    categoryKey: 'Equipment',
    icon: <Wrench size={18} />,
    color: '#0284c7',
    bgLight: '#f0f9ff',
    borderColor: '#bae6fd',
    telemetryKey: 'equipment_telemetry',
    sampleFields: ['vibration_velocity_mm_s', 'bearing_temp_c', 'operating_hours', 'lubricant_state'],
    description: 'Centrifugal pumps, turbine generators, rotating assemblies & bearing vibration'
  },
  {
    name: 'Civil Structural Engineering',
    categoryKey: 'Structural',
    icon: <Building2 size={18} />,
    color: '#7c3aed',
    bgLight: '#f5f3ff',
    borderColor: '#ddd6fe',
    telemetryKey: 'structural_telemetry',
    sampleFields: ['crack_width_mm', 'deflection_mm', 'load_rating_tons', 'corrosion_rating'],
    description: 'Bridges, concrete piers, load-bearing columns & foundation displacement'
  },
  {
    name: 'HazMat & Environmental',
    categoryKey: 'Environmental',
    icon: <ShieldAlert size={18} />,
    color: '#059669',
    bgLight: '#ecfdf5',
    borderColor: '#a7f3d0',
    telemetryKey: 'hazmat_telemetry',
    sampleFields: ['voc_ppm', 'containment_integrity', 'ph_level', 'spill_mitigation_ready'],
    description: 'Chemical processing, toxic airborne VOC levels, containment seals & runoff'
  },
  {
    name: 'Commercial HVAC Systems',
    categoryKey: 'HVAC',
    icon: <Thermometer size={18} />,
    color: '#0891b2',
    bgLight: '#ecfeff',
    borderColor: '#a5f3fc',
    telemetryKey: 'hvac_telemetry',
    sampleFields: ['chilled_water_temp_c', 'refrigerant_psi', 'airflow_cfm', 'cop_efficiency'],
    description: 'Rooftop chillers, variable air volume units, compressor delta & airflow'
  }
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [schemaOverview, setSchemaOverview] = useState<SchemaOverviewResponse | null>(null);
  const [recentReports, setRecentReports] = useState<InspectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [previewReport, setPreviewReport] = useState<InspectionReport | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, reportsData, schemaData] = await Promise.all([
        api.getDashboardStats(),
        api.getReports({ limit: 10, sort_by: 'inspection_date', sort_order: 'desc' }),
        api.getDocumentSchema().catch(() => null)
      ]);
      setStats(statsData);
      setRecentReports(reportsData.reports);
      if (schemaData) {
        setSchemaOverview(schemaData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data. Ensure backend is running on localhost:8000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopyJson = (doc: InspectionReport) => {
    navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const totalReports = stats?.total_reports ?? 0;
  const filteredReports = selectedCategoryFilter === 'all'
    ? recentReports
    : recentReports.filter(r => r.category.toLowerCase() === selectedCategoryFilter.toLowerCase());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Truthful Local Demo Mode Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1e40af',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Info size={18} color="#2563eb" style={{ flexShrink: 0 }} />
          <span>
            <strong>Local Demo Mode:</strong> Dashboard metrics are calculated dynamically from the application's local inspection repository. No live Amazon DocumentDB cluster, CloudWatch telemetry, or live AWS billing is currently connected.
          </span>
        </div>
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          padding: '0.2rem 0.6rem',
          borderRadius: 'var(--radius-full)',
          backgroundColor: '#dbeafe',
          color: '#1e40af',
          whiteSpace: 'nowrap',
          marginLeft: '1rem'
        }}>
          Phase 1 Architecture
        </span>
      </div>

      {/* Header & Quick Actions */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Operational Dashboard
            </h2>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-primary-focus)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <Database size={11} /> Document-Oriented Architecture (MongoDB API Compatible)
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--color-text-secondary)' }}>
            Inspection analytics, variable-schema JSON documents, and nested DocumentDB-compatible query analytics.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={fetchDashboardData}
            className="btn btn-secondary btn-sm"
            title="Refresh statistics"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <Link to="/ai-assistant" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} color="var(--color-primary)" />
            <span>AI Assistant</span>
          </Link>

          <Link to="/nested-query" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <SearchCode size={14} />
            <span>Query Laboratory</span>
          </Link>

          <Link to="/create-inspection" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={15} />
            <span>New Inspection</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <div>{error}</div>
        </div>
      )}

      {/* Transparent System Architecture Strip */}
      <div style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Storage Mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <Server size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Inspection Storage Mode
              </div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {stats?.storage_mode || 'Local In-Memory Repository'}{' '}
                <span style={{ fontSize: '0.72rem', color: stats?.aws_connected ? '#059669' : '#64748b', fontWeight: 500 }}>
                  {stats?.aws_connected ? '(AWS DocDB Connected)' : '(AWS DocDB Not Connected)'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ width: 1, height: 28, backgroundColor: 'var(--color-border)' }} />

          {/* Discovered Paths */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}>
              <Boxes size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Discovered Schema Paths
              </div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#059669' }}>
                {schemaOverview && totalReports > 0
                  ? `${schemaOverview.nested_fields_count} Nested Fields • ${schemaOverview.arrays_count} Arrays`
                  : totalReports === 0 ? '0 Discovered Paths (Empty Repository)' : 'Analyzing Schema...'}
              </div>
            </div>
          </div>

          <div style={{ width: 1, height: 28, backgroundColor: 'var(--color-border)' }} />

          {/* Sizing Model */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#fffbeb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706'
            }}>
              <DollarSign size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Estimated Cost Sizing Model
              </div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#d97706' }}>
                $0.00/mo (Local Dev) • $13.98/mo (Scheduled Dev Estimate)
              </div>
            </div>
          </div>
        </div>

        <Link
          to="/cost-optimizer"
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            textDecoration: 'none'
          }}
        >
          <span>Configure Workload & Sizing</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Summary KPI Cards (Derived from Real Application Data) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {/* Card 1: Total Reports */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Reports
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {stats?.total_reports ?? 0}
              </div>
            </div>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <FileText size={22} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            <span>Source: Inspection Repository</span>
            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
              {totalReports === 0 ? 'No documents' : `${totalReports} document${totalReports === 1 ? '' : 's'}`}
            </span>
          </div>
        </div>

        {/* Card 2: High Severity */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                High & Critical Findings
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#dc2626', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {stats?.high_severity_findings ?? 0}
              </div>
            </div>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626'
            }}>
              <AlertOctagon size={22} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#991b1b' }}>
            <span>Source: Document Findings</span>
            <span style={{ fontWeight: 600 }}>Parsed from findings arrays</span>
          </div>
        </div>

        {/* Card 3: In Review / Attention */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pending Review
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#d97706', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {stats?.reports_requiring_attention ?? 0}
              </div>
            </div>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#fffbeb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706'
            }}>
              <Clock size={22} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#92400e' }}>
            <span>Source: Report Status Evaluator</span>
            <span style={{ fontWeight: 600 }}>Action needed / in review</span>
          </div>
        </div>

        {/* Card 4: Passed / Completed */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Completed & Passed
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {stats?.completed_inspections ?? 0}
              </div>
            </div>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}>
              <CheckCircle size={22} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#065f46' }}>
            <span>Source: Compliance Verification</span>
            <span style={{ fontWeight: 600 }}>Zero open violations</span>
          </div>
        </div>
      </div>

      {/* Empty State Banner if no reports exist */}
      {totalReports === 0 && !loading && (
        <div className="card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
          <FolderOpen size={44} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
            No Inspection Data in Repository
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto 1.25rem' }}>
            Create your first inspection report to populate dynamic dashboard statistics, schema discovery paths, and polymorphic domain distributions.
          </p>
          <Link to="/create-inspection" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={15} />
            <span>Create First Inspection Report</span>
          </Link>
        </div>
      )}

      {/* Polymorphic Domain Catalog (Variable Schema Demonstration) */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem' }}>
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--color-primary)" />
              Polymorphic Inspection Domains & Telemetry Schemas
            </h3>
            <p style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: 'var(--color-text-secondary)' }}>
              Heterogeneous inspection categories with polymorphic telemetry schemas stored in a single collection. Counts derived from repository.
            </p>
          </div>
          <Link to="/nested-query" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <SearchCode size={14} />
            <span>Explore Discovered Schemas</span>
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '1rem'
        }}>
          {DOMAIN_CATALOG.map((domain) => {
            const count = stats?.category_distribution?.[domain.categoryKey] || 0;
            const isSelected = selectedCategoryFilter.toLowerCase() === domain.categoryKey.toLowerCase();
            return (
              <div
                key={domain.categoryKey}
                onClick={() => setSelectedCategoryFilter(isSelected ? 'all' : domain.categoryKey)}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: isSelected ? 'var(--color-primary-light)' : 'var(--color-bg-surface-secondary)',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: 30,
                        height: 30,
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: domain.bgLight,
                        color: domain.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {domain.icon}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                        {domain.name}
                      </span>
                    </div>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                      color: isSelected ? '#ffffff' : count > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      border: '1px solid var(--color-border)'
                    }}>
                      {count} report{count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: '0 0 0.5rem 0' }}>
                    {domain.description}
                  </p>
                </div>

                <div style={{
                  padding: '0.5rem',
                  backgroundColor: 'var(--color-bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)'
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                    Polymorphic Schema Attributes:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {domain.sampleFields.map(f => (
                      <code key={f} style={{
                        fontSize: '0.68rem',
                        padding: '0.15rem 0.35rem',
                        backgroundColor: 'var(--color-bg-surface-secondary)',
                        color: domain.color,
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600
                      }}>
                        {f}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distributions & AI Quick Assist Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} color="var(--color-primary)" />
              Inspection Status Distribution
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Source: Status Evaluator</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {stats && Object.keys(stats.status_distribution).length > 0 ? (
              Object.entries(stats.status_distribution).map(([statusKey, count]) => {
                const pct = totalReports > 0 ? Math.round((count / totalReports) * 100) : 0;
                return (
                  <div key={statusKey}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <StatusBadge status={statusKey} />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 7, backgroundColor: 'var(--color-bg-surface-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: statusKey === 'passed' ? 'var(--color-success)' : statusKey === 'action_required' ? 'var(--color-warning)' : statusKey === 'failed' ? 'var(--color-danger)' : 'var(--color-primary)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>
                No status distribution data available.
              </div>
            )}
          </div>
        </div>

        {/* Severity Stratification & AI Shortcuts */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="var(--color-primary)" />
                AI Assistant & DocumentDB Shortcuts
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Gemini 2.5 Flash</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div
                onClick={() => navigate('/ai-assistant')}
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--color-bg-surface-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.15s'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    🤖 Natural Language Query Generator
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                    Generate validated MongoDB-compatible queries using plain English
                  </div>
                </div>
                <ArrowRight size={15} color="var(--color-primary)" />
              </div>

              <div
                onClick={() => navigate('/nested-query')}
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--color-bg-surface-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.15s'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    🔬 $elemMatch Multi-Condition Laboratory
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                    Build atomic subdocument filters targeting the same array element
                  </div>
                </div>
                <ArrowRight size={15} color="var(--color-primary)" />
              </div>

              <div
                onClick={() => navigate('/cost-optimizer')}
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--color-bg-surface-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.15s'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    💰 Cost Optimization & Scheduled Dev Advisor
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                    Calculate AWS cluster savings with scheduled start/stop (160h/mo)
                  </div>
                </div>
                <ArrowRight size={15} color="var(--color-primary)" />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Severity distribution:</span>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {stats && Object.keys(stats.severity_distribution).length > 0 ? (
                Object.entries(stats.severity_distribution).map(([sev, count]) => (
                  <span key={sev} style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <SeverityBadge severity={sev} />
                    <strong>{count}</strong>
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>0 findings recorded</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Inspection Reports Table */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 className="card-title">Recent Inspection Documents</h3>
            <p style={{ fontSize: '0.8rem', marginTop: '0.15rem', color: 'var(--color-text-secondary)' }}>
              Live variable-schema reports in repository • Showing {filteredReports.length} of {recentReports.length}
            </p>
          </div>

          {/* Domain Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`btn btn-sm ${selectedCategoryFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              All Domains ({recentReports.length})
            </button>
            {DOMAIN_CATALOG.map(d => {
              const count = recentReports.filter(r => r.category.toLowerCase() === d.categoryKey.toLowerCase()).length;
              if (count === 0) return null;
              return (
                <button
                  key={d.categoryKey}
                  onClick={() => setSelectedCategoryFilter(d.categoryKey)}
                  className={`btn btn-sm ${selectedCategoryFilter.toLowerCase() === d.categoryKey.toLowerCase() ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                >
                  {d.categoryKey} ({count})
                </button>
              );
            })}
            <Link to="/reports" className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', marginLeft: '0.5rem' }}>
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {filteredReports.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <FileText size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ fontWeight: 700 }}>No Reports Found for this Filter</h4>
            <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 1rem', color: 'var(--color-text-muted)' }}>
              Try selecting "All Domains" or create a new inspection report.
            </p>
            <button onClick={() => setSelectedCategoryFilter('all')} className="btn btn-secondary btn-sm">
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Title & Inspection Domain</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Nested Structure</th>
                  <th style={{ textAlign: 'right' }}>Quick Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <code style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{report.id}</code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {report.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                        Domain: <strong>{report.category}</strong> | Inspector: {report.inspector_name}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
                      {report.location}
                    </td>
                    <td style={{ fontSize: '0.825rem', whiteSpace: 'nowrap' }}>
                      {report.inspection_date}
                    </td>
                    <td>
                      <SeverityBadge severity={report.overall_severity} />
                    </td>
                    <td>
                      <StatusBadge status={report.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: 'var(--color-bg-surface-secondary)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {report.findings.length} findings ({report.findings.reduce((acc, f) => acc + (f.issues?.length || 0), 0)} issues)
                        </span>
                        {report.dynamic_attributes && Object.keys(report.dynamic_attributes).length > 0 && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                            + {Object.keys(report.dynamic_attributes).join(', ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => setPreviewReport(report)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          title="Quick View JSON Structure"
                        >
                          <FileCode size={13} />
                          <span>JSON</span>
                        </button>
                        <Link to={`/reports/${report.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                          <span>Details</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Quick Preview Modal */}
      {previewReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '780px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid #334155'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileCode size={20} color="var(--color-primary)" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                    Document JSON: {previewReport.id}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                    {previewReport.title} ({previewReport.category})
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => handleCopyJson(previewReport)}
                  className="btn btn-secondary btn-sm"
                  style={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                >
                  {copiedJson ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setPreviewReport(null)}
                  className="btn btn-secondary btn-sm"
                  style={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Modal Code Body */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, backgroundColor: '#090d16' }}>
              <pre style={{
                margin: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                lineHeight: 1.5,
                color: '#38bdf8'
              }}>
                {JSON.stringify(previewReport, null, 2)}
              </pre>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#0f172a'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Polymorphic BSON Document Collection: <code>inspection_reports</code>
              </span>
              <Link
                to={`/reports/${previewReport.id}`}
                className="btn btn-primary btn-sm"
                onClick={() => setPreviewReport(null)}
              >
                <span>Full Inspection View</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
