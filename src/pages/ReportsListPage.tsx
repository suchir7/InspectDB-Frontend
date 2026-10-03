import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  AlertTriangle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { InspectionReport } from '../types';
import { StatusBadge, SeverityBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { DemoBanner } from '../components/common/DemoBanner';

export const ReportsListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [severity, setSeverity] = useState(searchParams.get('severity') || 'all');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort_order') || 'desc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const limit = 6;

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<InspectionReport | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReports({
        search: search.trim() || undefined,
        category,
        status,
        severity,
        sort_by: 'inspection_date',
        sort_order: sortOrder,
        page,
        limit
      });
      setReports(data.reports);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inspection reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [category, status, severity, sortOrder, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('all');
    setStatus('all');
    setSeverity('all');
    setSortOrder('desc');
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    setDeleting(true);
    try {
      await api.deleteReport(reportToDelete.id);
      setDeleteModalOpen(false);
      setReportToDelete(null);
      setSuccessMsg(`Report ${reportToDelete.id} was successfully deleted.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchReports();
    } catch (err: any) {
      setError(err.message || 'Failed to delete report');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <DemoBanner />

      {/* Header & New Report CTA */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Inspection Reports Repository</h2>
          <p style={{ fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Browse, search, and manage variable-schema inspection documents.
          </p>
        </div>

        <Link to="/create-inspection" className="btn btn-primary btn-sm">
          <Plus size={16} />
          <span>New Inspection Report</span>
        </Link>
      </div>

      {successMsg && (
        <div className="alert alert-success">
          <div>{successMsg}</div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <div>{error}</div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            {/* Search Box */}
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search by ID, title, inspector, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2.2rem' }}
              />
            </div>

            {/* Category Filter */}
            <div style={{ flex: '1 1 150px' }}>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="form-control"
              >
                <option value="all">All Categories</option>
                <option value="Electrical">Electrical</option>
                <option value="Fire Safety">Fire Safety</option>
                <option value="Structural">Structural</option>
                <option value="Equipment">Equipment</option>
                <option value="Environmental">Environmental</option>
                <option value="HVAC">HVAC</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div style={{ flex: '1 1 140px' }}>
              <select
                value={severity}
                onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
                className="form-control"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ flex: '1 1 140px' }}>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="form-control"
              >
                <option value="all">All Statuses</option>
                <option value="action_required">Action Required</option>
                <option value="in_review">In Review</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            {/* Date Sort Order */}
            <div style={{ flex: '1 1 140px' }}>
              <select
                value={sortOrder}
                onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
                className="form-control"
              >
                <option value="desc">Date (Newest First)</option>
                <option value="asc">Date (Oldest First)</option>
              </select>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary btn-sm">
                <Search size={14} />
                <span>Search</span>
              </button>
              <button type="button" onClick={handleResetFilters} className="btn btn-secondary btn-sm" title="Reset all filters">
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Reports Table / Card Container */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading inspection reports...</div>
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <Layers size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.7 }} />
            {(!search && category === 'all' && status === 'all' && severity === 'all') ? (
              <>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)' }}>No inspection reports found.</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0.4rem 0 1.5rem', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                  No inspection documents exist in the repository. Create your first document to start exploring variable-schema inspections.
                </p>
                <Link to="/create-inspection" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem' }}>
                  <Plus size={16} />
                  <span>+ Create Inspection Report</span>
                </Link>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No inspection reports match your filter.</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 1.25rem' }}>
                  Try broadening your search term or resetting active filters.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={handleResetFilters} className="btn btn-secondary btn-sm">
                    <RotateCcw size={14} />
                    <span>Clear Filters</span>
                  </button>
                  <Link to="/create-inspection" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={14} />
                    <span>+ Create Inspection Report</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Inspection Title & Domain</th>
                  <th>Inspector</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Findings</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <code style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{report.id}</code>
                    </td>
                    <td>
                      <Link
                        to={`/reports/${report.id}`}
                        style={{ fontWeight: 600, color: 'var(--color-text-primary)', display: 'block' }}
                      >
                        {report.title}
                      </Link>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Category: {report.category}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {report.inspector_name}
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
                        {report.findings.length} findings
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Link
                          to={`/reports/${report.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.5rem' }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          to={`/edit-inspection/${report.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.5rem' }}
                          title="Edit Report"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button
                          onClick={() => {
                            setReportToDelete(report);
                            setDeleteModalOpen(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.5rem', color: 'var(--color-danger)' }}
                          title="Delete Report"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {total > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-surface-secondary)',
            fontSize: '0.825rem'
          }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total} reports
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft size={15} />
                <span>Previous</span>
              </button>
              <span style={{ fontWeight: 600, padding: '0 0.5rem' }}>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="btn btn-secondary btn-sm"
              >
                <span>Next</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Report Deletion"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Report'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-full)',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Are you sure you want to delete this report?</h4>
            <p style={{ fontSize: '0.85rem' }}>
              This will permanently remove report <code style={{ fontWeight: 700 }}>{reportToDelete?.id}</code> ({reportToDelete?.title}) from the repository.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
