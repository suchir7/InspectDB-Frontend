import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { InspectionReport, Finding, Issue, CustomField, ReportStatus, SeverityLevel } from '../types';
import { DemoBanner } from '../components/common/DemoBanner';

export const EditReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [location, setLocation] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<ReportStatus>('in_review');
  const [overallSeverity, setOverallSeverity] = useState<SeverityLevel>('medium');
  const [description, setDescription] = useState('');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [dynamicAttributes, setDynamicAttributes] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!reportId) return;
    const fetchReport = async () => {
      setLoading(true);
      try {
        const report = await api.getReportById(reportId);
        setTitle(report.title || '');
        setInspectorName(report.inspector_name || '');
        setLocation(report.location || '');
        setInspectionDate(report.inspection_date || '');
        setCategory(report.category || 'General');
        setStatus(report.status || 'in_review');
        setOverallSeverity(report.overall_severity || 'medium');
        setDescription(report.description || '');
        setFindings(report.findings || []);
        setCustomFields(report.custom_fields || []);
        setDynamicAttributes(report.dynamic_attributes || {});
      } catch (err: any) {
        setError(err.message || `Failed to load report ${reportId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const handleAddFinding = () => {
    const newId = `FND-${(findings.length + 1).toString().padStart(2, '0')}`;
    setFindings([
      ...findings,
      {
        finding_id: newId,
        category: 'General Assessment',
        severity: 'low',
        description: '',
        location_details: '',
        issues: []
      }
    ]);
  };

  const handleRemoveFinding = (index: number) => {
    setFindings(findings.filter((_, i) => i !== index));
  };

  const handleUpdateFinding = (index: number, field: keyof Finding, value: any) => {
    const updated = [...findings];
    updated[index] = { ...updated[index], [field]: value };
    setFindings(updated);
  };

  const handleAddIssue = (findingIndex: number) => {
    const updated = [...findings];
    const targetFinding = updated[findingIndex];
    const newIssueId = `ISS-${findingIndex + 1}${(targetFinding.issues.length + 1).toString().padStart(2, '0')}`;
    targetFinding.issues.push({
      issue_id: newIssueId,
      title: '',
      severity: 'medium',
      code_reference: '',
      status: 'open',
      notes: ''
    });
    setFindings(updated);
  };

  const handleRemoveIssue = (findingIndex: number, issueIndex: number) => {
    const updated = [...findings];
    updated[findingIndex].issues = updated[findingIndex].issues.filter((_, i) => i !== issueIndex);
    setFindings(updated);
  };

  const handleUpdateIssue = (findingIndex: number, issueIndex: number, field: keyof Issue, value: any) => {
    const updated = [...findings];
    updated[findingIndex].issues[issueIndex] = {
      ...updated[findingIndex].issues[issueIndex],
      [field]: value
    };
    setFindings(updated);
  };

  const handleAddCustomField = () => {
    setCustomFields([
      ...customFields,
      { key: '', value: '', field_type: 'string' }
    ]);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleUpdateCustomField = (index: number, field: keyof CustomField, value: any) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], [field]: value };
    setCustomFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportId) return;

    setSubmitting(true);
    setError(null);

    const processedCustomFields = customFields
      .filter(cf => cf.key.trim().length > 0)
      .map(cf => {
        let parsedVal = cf.value;
        if (cf.field_type === 'number') {
          parsedVal = Number(cf.value) || 0;
        } else if (cf.field_type === 'boolean') {
          parsedVal = String(cf.value).toLowerCase() === 'true';
        } else if (cf.field_type === 'json') {
          try {
            parsedVal = typeof cf.value === 'string' ? JSON.parse(cf.value) : cf.value;
          } catch {
            parsedVal = cf.value;
          }
        }
        return { key: cf.key.trim(), value: parsedVal, field_type: cf.field_type };
      });

    try {
      await api.updateReport(reportId, {
        title: title.trim(),
        inspector_name: inspectorName.trim(),
        location: location.trim(),
        inspection_date: inspectionDate,
        category,
        status,
        overall_severity: overallSeverity,
        description: description.trim() || undefined,
        findings,
        custom_fields: processedCustomFields,
        dynamic_attributes: dynamicAttributes
      });

      navigate(`/reports/${reportId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update inspection report.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Loading report data for editing...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <DemoBanner />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate(`/reports/${reportId}`)} className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} />
            <span>Cancel</span>
          </button>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Edit Inspection Report: {reportId}</h2>
            <p style={{ fontSize: '0.825rem', marginTop: '0.15rem' }}>
              Update metadata, nested findings, or dynamic schema fields.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Core Inspection Metadata</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Report Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Inspector Name</label>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Inspection Date</label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-control"
              >
                <option value="Electrical">Electrical</option>
                <option value="Fire Safety">Fire Safety</option>
                <option value="Structural">Structural</option>
                <option value="Equipment">Equipment</option>
                <option value="Environmental">Environmental</option>
                <option value="HVAC">HVAC</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Overall Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReportStatus)}
                className="form-control"
              >
                <option value="in_review">In Review</option>
                <option value="action_required">Action Required</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Overall Severity</label>
              <select
                value={overallSeverity}
                onChange={(e) => setOverallSeverity(e.target.value as SeverityLevel)}
                className="form-control"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="none">None</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description / Findings Summary</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-control"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Findings */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Findings ({findings.length})</h3>
            </div>
            <button type="button" onClick={handleAddFinding} className="btn btn-secondary btn-sm">
              <Plus size={14} />
              <span>Add Finding</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {findings.map((finding, fIndex) => (
              <div
                key={fIndex}
                style={{
                  backgroundColor: 'var(--color-bg-surface-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  padding: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                    Finding #{fIndex + 1} ({finding.finding_id || `FND-${fIndex + 1}`})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFinding(fIndex)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-danger)', padding: '0.2rem 0.5rem' }}
                  >
                    <Trash2 size={15} />
                    <span>Remove</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      value={finding.category}
                      onChange={(e) => handleUpdateFinding(fIndex, 'category', e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Severity</label>
                    <select
                      value={finding.severity}
                      onChange={(e) => handleUpdateFinding(fIndex, 'severity', e.target.value as SeverityLevel)}
                      className="form-control"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location Details</label>
                    <input
                      type="text"
                      value={finding.location_details || ''}
                      onChange={(e) => handleUpdateFinding(fIndex, 'location_details', e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description</label>
                    <textarea
                      value={finding.description}
                      onChange={(e) => handleUpdateFinding(fIndex, 'description', e.target.value)}
                      className="form-control"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Sub-issues */}
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--color-bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.825rem' }}>
                      Sub-Issues ({finding.issues.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddIssue(fIndex)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    >
                      <Plus size={13} />
                      <span>Add Issue</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {finding.issues.map((issue, iIndex) => (
                      <div
                        key={iIndex}
                        style={{
                          padding: '0.75rem',
                          border: '1px dashed var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-bg-surface-secondary)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                            Issue #{iIndex + 1} ({issue.issue_id})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveIssue(fIndex, iIndex)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-danger)', padding: '0.15rem' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Title</label>
                            <input
                              type="text"
                              value={issue.title}
                              onChange={(e) => handleUpdateIssue(fIndex, iIndex, 'title', e.target.value)}
                              className="form-control"
                              style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Code Reference</label>
                            <input
                              type="text"
                              value={issue.code_reference || ''}
                              onChange={(e) => handleUpdateIssue(fIndex, iIndex, 'code_reference', e.target.value)}
                              className="form-control"
                              style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Severity</label>
                            <select
                              value={issue.severity}
                              onChange={(e) => handleUpdateIssue(fIndex, iIndex, 'severity', e.target.value as SeverityLevel)}
                              className="form-control"
                              style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                            >
                              <option value="critical">Critical</option>
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Status</label>
                            <select
                              value={issue.status}
                              onChange={(e) => handleUpdateIssue(fIndex, iIndex, 'status', e.target.value as any)}
                              className="form-control"
                              style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                            >
                              <option value="open">Open</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Fields */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Dynamic Custom Fields</h3>
            </div>
            <button type="button" onClick={handleAddCustomField} className="btn btn-secondary btn-sm">
              <Plus size={14} />
              <span>Add Field</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {customFields.map((cf, cIndex) => (
              <div
                key={cIndex}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem',
                  backgroundColor: 'var(--color-bg-surface-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <input
                  type="text"
                  placeholder="Key"
                  value={cf.key}
                  onChange={(e) => handleUpdateCustomField(cIndex, 'key', e.target.value)}
                  className="form-control"
                  style={{ flex: 1, fontSize: '0.825rem' }}
                />
                <select
                  value={cf.field_type}
                  onChange={(e) => handleUpdateCustomField(cIndex, 'field_type', e.target.value as any)}
                  className="form-control"
                  style={{ width: '130px', fontSize: '0.825rem' }}
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="json">JSON</option>
                </select>
                <input
                  type="text"
                  placeholder="Value"
                  value={typeof cf.value === 'object' ? JSON.stringify(cf.value) : cf.value}
                  onChange={(e) => handleUpdateCustomField(cIndex, 'value', e.target.value)}
                  className="form-control"
                  style={{ flex: 2, fontSize: '0.825rem' }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCustomField(cIndex)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--color-danger)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          padding: '1.25rem',
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <button
            type="button"
            onClick={() => navigate(`/reports/${reportId}`)}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            <Save size={16} />
            <span>{submitting ? 'Updating Report...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
