import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  User,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  FileCode,
  ShieldAlert,
  Hash,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { InspectionReport } from '../types';
import { StatusBadge, SeverityBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { JsonViewer } from '../components/common/JsonViewer';
import { DemoBanner } from '../components/common/DemoBanner';

export const ReportDetailsPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<InspectionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!reportId) return;
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getReportById(reportId);
        setReport(data);
      } catch (err: any) {
        setError(err.message || `Failed to fetch report ${reportId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [reportId]);

  const handleDelete = async () => {
    if (!reportId) return;
    setDeleting(true);
    try {
      await api.deleteReport(reportId);
      navigate('/reports');
    } catch (err: any) {
      setError(err.message || 'Failed to delete report.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
        <p>Loading document details from repository...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px', margin: '2rem auto' }}>
        <div className="alert alert-danger">
          <AlertTriangle size={20} />
          <div>{error || 'Inspection report not found.'}</div>
        </div>
        <Link to="/reports" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
          <ArrowLeft size={16} />
          <span>Back to Reports List</span>
        </Link>
      </div>
    );
  }

  const totalIssues = report.findings?.reduce((acc, f) => acc + (f.issues?.length || 0), 0) || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <DemoBanner />

      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate('/reports')} className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} />
            <span>Reports</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>{report.id}</span>
            <StatusBadge status={report.status} />
            <SeverityBadge severity={report.overall_severity} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link to={`/edit-inspection/${report.id}`} className="btn btn-secondary btn-sm">
            <Edit2 size={14} />
            <span>Edit Report</span>
          </Link>
          <button onClick={() => setDeleteModalOpen(true)} className="btn btn-danger btn-sm">
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          {report.title}
        </h2>

        {report.description && (
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem', lineHeight: '1.6' }}>
            {report.description}
          </p>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--color-border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <User size={18} color="var(--color-primary)" />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Lead Inspector</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{report.inspector_name}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <MapPin size={18} color="var(--color-primary)" />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Location</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{report.location}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Calendar size={18} color="var(--color-primary)" />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Date of Inspection</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{report.inspection_date}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Tag size={18} color="var(--color-primary)" />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Domain / Category</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{report.category}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Findings & Nested Sub-Issues */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} color="var(--color-primary)" />
            <h3 className="card-title">
              Detailed Findings & Nested Issues ({report.findings?.length || 0} findings, {totalIssues} sub-issues)
            </h3>
          </div>
        </div>

        {(!report.findings || report.findings.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
            <CheckCircle2 size={36} color="var(--color-success)" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Zero Non-Conformances Logged</div>
            <p style={{ fontSize: '0.825rem', marginTop: '0.2rem' }}>All tested components met regulatory threshold baselines.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {report.findings.map((finding, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-surface-secondary)',
                  padding: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {finding.finding_id ? `${finding.finding_id}: ` : ''}{finding.category}
                      </span>
                      <SeverityBadge severity={finding.severity} />
                    </div>
                    {finding.location_details && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                        📍 {finding.location_details}
                      </div>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '1rem', lineHeight: '1.5' }}>
                  {finding.description}
                </p>

                {/* Custom Metrics for this finding if present */}
                {finding.custom_metrics && Object.keys(finding.custom_metrics).length > 0 && (
                  <div style={{
                    marginBottom: '1rem',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--color-bg-surface)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.8rem'
                  }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-text-secondary)', marginRight: '0.5rem' }}>
                      Diagnostic Telemetry:
                    </span>
                    {Object.entries(finding.custom_metrics).map(([k, v], mIdx) => (
                      <span key={k} style={{ marginRight: '0.75rem' }}>
                        <code>{k}</code>: <strong>{String(v)}</strong>{mIdx < Object.keys(finding.custom_metrics!).length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                )}

                {/* Nested Issues Table */}
                {finding.issues && finding.issues.length > 0 && (
                  <div style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '0.5rem 0.85rem',
                      backgroundColor: 'var(--color-bg-surface-secondary)',
                      borderBottom: '1px solid var(--color-border)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--color-text-secondary)'
                    }}>
                      Sub-Issues & Action Directives ({finding.issues.length})
                    </div>
                    <div className="table-responsive" style={{ border: 'none' }}>
                      <table className="table" style={{ margin: 0, fontSize: '0.8rem' }}>
                        <thead>
                          <tr>
                            <th>Issue ID / Title</th>
                            <th>Code Reference</th>
                            <th>Severity</th>
                            <th>Status</th>
                            <th>Inspector Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {finding.issues.map((issue, iIdx) => (
                            <tr key={iIdx}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{issue.title}</div>
                                {issue.issue_id && (
                                  <code style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{issue.issue_id}</code>
                                )}
                              </td>
                              <td>
                                {issue.code_reference ? (
                                  <code style={{ fontSize: '0.75rem' }}>{issue.code_reference}</code>
                                ) : (
                                  <span style={{ color: 'var(--color-text-muted)' }}>N/A</span>
                                )}
                              </td>
                              <td>
                                <SeverityBadge severity={issue.severity} />
                              </td>
                              <td>
                                <span style={{
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  backgroundColor: issue.status === 'resolved' ? '#d1fae5' : issue.status === 'in_progress' ? '#fef3c7' : '#fee2e2',
                                  color: issue.status === 'resolved' ? '#065f46' : issue.status === 'in_progress' ? '#92400e' : '#991b1b'
                                }}>
                                  {issue.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td style={{ color: 'var(--color-text-secondary)', maxWidth: '280px' }}>
                                {issue.notes || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Custom Fields & Dynamic Attributes (Variable Schema) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Custom Fields Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--color-primary)" />
              Dynamic Domain Fields
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Variable Schema</span>
          </div>

          {(!report.custom_fields || report.custom_fields.length === 0) ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              No custom fields specified for this report.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {report.custom_fields.map((cf, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    backgroundColor: 'var(--color-bg-surface-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.825rem'
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    {cf.key}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      ({cf.field_type})
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Nested Attributes Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} color="var(--color-primary)" />
              Heterogeneous Nested Telemetry
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Unstructured BSON</span>
          </div>

          {(!report.dynamic_attributes || Object.keys(report.dynamic_attributes).length === 0) ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              No unstructured telemetry attached to this document.
            </p>
          ) : (
            <pre style={{
              margin: 0,
              padding: '0.85rem',
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              borderRadius: 'var(--radius-md)',
              maxHeight: '220px',
              overflowY: 'auto',
              fontSize: '0.78rem'
            }}>
              <code>{JSON.stringify(report.dynamic_attributes, null, 2)}</code>
            </pre>
          )}
        </div>
      </div>

      {/* Raw BSON/JSON Document Inspector */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCode size={18} color="var(--color-primary)" />
              Complete Amazon DocumentDB BSON Document View
            </h3>
            <p style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
              Exact representation as stored in collection <code style={{ fontSize: '0.75rem' }}>inspection_reports</code>
            </p>
          </div>
        </div>

        <JsonViewer data={report} />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Inspection Report"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Confirm Deletion'}
            </button>
          </>
        }
      >
        <p style={{ fontSize: '0.875rem' }}>
          Are you sure you want to delete report <strong>{report.id}</strong> ({report.title})? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};
