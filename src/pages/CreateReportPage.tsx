import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Layers,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Finding, Issue, CustomField, ReportStatus, SeverityLevel } from '../types';
import { DemoBanner } from '../components/common/DemoBanner';

export const CreateReportPage: React.FC = () => {
  const navigate = useNavigate();

  // Basic Info
  const [title, setTitle] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [location, setLocation] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Electrical');
  const [status, setStatus] = useState<ReportStatus>('in_review');
  const [overallSeverity, setOverallSeverity] = useState<SeverityLevel>('medium');
  const [description, setDescription] = useState('');

  // Nested Findings List (starts empty for user-driven input)
  const [findings, setFindings] = useState<Finding[]>([]);

  // Variable Schema Custom Fields (starts empty for user-driven input)
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Dynamic Findings Handlers
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

  // Nested Issues Handlers
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

  // Custom Variable Schema Fields Handlers
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

  // Form Validation
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Report title is required.';
    if (!inspectorName.trim()) errs.inspectorName = 'Inspector name is required.';
    if (!location.trim()) errs.location = 'Inspection location is required.';
    if (!inspectionDate) errs.inspectionDate = 'Inspection date is required.';

    findings.forEach((f, idx) => {
      if (!f.description.trim()) {
        errs[`finding_${idx}`] = `Finding #${idx + 1} description cannot be empty.`;
      }
    });

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);

    // Process custom fields into typed values
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
      const created = await api.createReport({
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
        dynamic_attributes: {}
      });

      navigate(`/reports/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create inspection report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <DemoBanner message="DocumentDB Variable Schema Engine: Add arbitrary findings, nested issues, and custom domain fields to create variable-schema documents." />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate('/reports')} className="btn btn-secondary btn-sm" title="Back to reports">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Create Variable-Schema Inspection</h2>
            <p style={{ fontSize: '0.825rem', marginTop: '0.15rem' }}>
              Stores hierarchical JSON documents with variable fields in the repository.
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
        {/* Section 1: Basic Inspection Metadata */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">1. Core Inspection Metadata</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Top-level BSON attributes</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Report Title <span className="required">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Substation Transformer Diagnostics & Bushing Inspection"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-control"
              />
              {validationErrors.title && <div className="form-error">{validationErrors.title}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Lead Inspector Name <span className="required">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah Jenkins, PE"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="form-control"
              />
              {validationErrors.inspectorName && <div className="form-error">{validationErrors.inspectorName}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Site Location <span className="required">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Building C - Level 3 Switchgear Room"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-control"
              />
              {validationErrors.location && <div className="form-error">{validationErrors.location}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Inspection Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="form-control"
              />
              {validationErrors.inspectionDate && <div className="form-error">{validationErrors.inspectionDate}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Inspection Category</label>
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
              <label className="form-label">Overall Report Status</label>
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
              <label className="form-label">Overall Severity Rating</label>
              <select
                value={overallSeverity}
                onChange={(e) => setOverallSeverity(e.target.value as SeverityLevel)}
                className="form-control"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="none">None / Nominal</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Executive Summary / Scope Description</label>
              <textarea
                placeholder="Describe the scope, methodologies, testing apparatus, and key conclusions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-control"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Dynamic Findings & Nested Issues */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">2. Dynamic Findings & Nested Issues</h3>
              <p style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
                Demonstrates nested document arrays (<code style={{ fontSize: '0.75rem' }}>findings[].issues[]</code>)
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddFinding}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={14} />
              <span>Add Finding Block</span>
            </button>
          </div>

          {findings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
              <p>No findings added yet. Click "Add Finding Block" above.</p>
            </div>
          ) : (
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
                      title="Remove Finding"
                    >
                      <Trash2 size={15} />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                    <div className="form-group">
                      <label className="form-label">Finding Category</label>
                      <input
                        type="text"
                        placeholder="e.g. Thermal Anomaly"
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
                        placeholder="e.g. Busbar Junction SG-02"
                        value={finding.location_details || ''}
                        onChange={(e) => handleUpdateFinding(fIndex, 'location_details', e.target.value)}
                        className="form-control"
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">
                        Finding Description <span className="required">*</span>
                      </label>
                      <textarea
                        placeholder="Describe the exact observation, measurements, or risk..."
                        value={finding.description}
                        onChange={(e) => handleUpdateFinding(fIndex, 'description', e.target.value)}
                        className="form-control"
                        rows={2}
                      />
                      {validationErrors[`finding_${fIndex}`] && (
                        <div className="form-error">{validationErrors[`finding_${fIndex}`]}</div>
                      )}
                    </div>
                  </div>

                  {/* Nested Issues inside this Finding */}
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--color-bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
                        Nested Sub-Issues ({finding.issues.length})
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

                    {finding.issues.length === 0 ? (
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        No nested sub-issues under this finding.
                      </div>
                    ) : (
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
                                Issue #{iIndex + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveIssue(fIndex, iIndex)}
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--color-danger)', padding: '0.15rem' }}
                                title="Remove Issue"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Issue Title</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Loose bolted clamp"
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
                                  placeholder="e.g. NEC 110.14"
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
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Variable Schema Custom Fields */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">3. Dynamic Domain Custom Fields (Variable Schema)</h3>
              <p style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
                Add custom key-value pairs of various data types to demonstrate schema flexibility.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddCustomField}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={14} />
              <span>Add Custom Field</span>
            </button>
          </div>

          {customFields.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)' }}>
              No custom fields added. Reports can exist with or without dynamic attributes.
            </div>
          ) : (
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
                  <div style={{ flex: '1 1 200px' }}>
                    <input
                      type="text"
                      placeholder="Field Key (e.g. vibration_hz)"
                      value={cf.key}
                      onChange={(e) => handleUpdateCustomField(cIndex, 'key', e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.825rem' }}
                    />
                  </div>

                  <div style={{ width: '130px' }}>
                    <select
                      value={cf.field_type}
                      onChange={(e) => handleUpdateCustomField(cIndex, 'field_type', e.target.value as any)}
                      className="form-control"
                      style={{ fontSize: '0.825rem' }}
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>

                  <div style={{ flex: '2 1 250px' }}>
                    <input
                      type="text"
                      placeholder="Value (e.g. 59.4, true, or [1,2,3])"
                      value={typeof cf.value === 'object' ? JSON.stringify(cf.value) : cf.value}
                      onChange={(e) => handleUpdateCustomField(cIndex, 'value', e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.825rem' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveCustomField(cIndex)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-danger)', padding: '0.35rem' }}
                    title="Remove Field"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Bar */}
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
            onClick={() => navigate('/reports')}
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
            <span>{submitting ? 'Creating Report...' : 'Save & Store Inspection Report'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
