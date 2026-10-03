import React from 'react';
import {
  Database,
  Server,
  DollarSign,
  AlertTriangle,
  Layers,
  ShieldCheck,
  CheckCircle2,
  FileCode,
  ArrowRight,
  ExternalLink,
  Cpu,
  Lock,
  GitBranch
} from 'lucide-react';
import { DemoBanner } from '../components/common/DemoBanner';

export const DatabaseOverviewPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <DemoBanner message="College Project Architecture Overview: Complete specification for Amazon DocumentDB deployment, document modeling, compatibility analysis, and AWS cost minimization strategies." />

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Amazon DocumentDB Architecture & Specifications</h2>
        <p style={{ fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Document-oriented database strategy for variable-schema inspection reports.
        </p>
      </div>

      {/* Database Status & Spec Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Database Engine
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
            Amazon DocumentDB
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            MongoDB 4.0 / 5.0 Compatible
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Data Model
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
            Hierarchical BSON
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Variable Schema JSON Documents
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Target Collection
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
            <code>inspection_reports</code>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Database: <code>inspectdb</code>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Connection Status
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.95rem',
            fontWeight: 800,
            color: '#a9801e',
            marginTop: '0.25rem'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#c9a23a' }} />
            Not Configured (Phase 1)
          </div>
          <div style={{ fontSize: '0.75rem', color: '#67718a', marginTop: '0.25rem' }}>
            Running in Local Development
          </div>
        </div>
      </div>

      {/* 4 Core Project Requirements Breakdown */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">4 Core Project Requirements & Implementation Strategy</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Req 1 */}
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-surface-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Layers size={18} color="var(--color-primary)" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>1. Variable-Schema Inspection Reports</h4>
            </div>
            <p style={{ fontSize: '0.825rem', lineHeight: '1.5', color: 'var(--color-text-secondary)' }}>
              Different domains (electrical transformers, high-rise fire safety, vibration machinery, bridge concrete) require drastically different telemetry and finding structures. A traditional relational database would require dozens of sparse tables or complex joins. In Amazon DocumentDB, each inspection report is stored as a self-contained BSON document with polymorphic sub-documents and dynamic key-value attributes.
            </p>
          </div>

          {/* Req 2 */}
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-surface-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Server size={18} color="var(--color-primary)" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>2. Querying Nested Document Structures</h4>
            </div>
            <p style={{ fontSize: '0.825rem', lineHeight: '1.5', color: 'var(--color-text-secondary)' }}>
              DocumentDB natively supports querying deep JSON hierarchies through dot notation (e.g. <code>findings.issues.severity: "critical"</code> or <code>dynamic_attributes.electrical_telemetry.phases.phase_a.voltage_kv: {`{"$gt": 13.0}`}</code>). Multikey indexes can be placed directly on array fields to provide single-digit millisecond lookup performance.
            </p>
          </div>

          {/* Req 3 */}
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-surface-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <GitBranch size={18} color="var(--color-primary)" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>3. MongoDB vs DocumentDB Compatibility Gaps</h4>
            </div>
            <p style={{ fontSize: '0.825rem', lineHeight: '1.5', color: 'var(--color-text-secondary)' }}>
              Amazon DocumentDB emulates MongoDB wire protocol on top of AWS Aurora-like shared storage. Key compatibility differences to account for include:
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem', fontSize: '0.78rem' }}>
                <li>No support for JavaScript evaluation (<code>$where</code>, MapReduce).</li>
                <li>Unsupported aggregation operators (e.g., specific <code>$graphLookup</code> variants).</li>
                <li>Case-sensitive index collations differ from MongoDB Community.</li>
                <li>Transactions are supported in replica set mode with specific isolation rules.</li>
              </ul>
            </p>
          </div>

          {/* Req 4 */}
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-surface-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <DollarSign size={18} color="var(--color-primary)" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>4. AWS Cluster Cost Minimization Strategy</h4>
            </div>
            <p style={{ fontSize: '0.825rem', lineHeight: '1.5', color: 'var(--color-text-secondary)' }}>
              Amazon DocumentDB does not have a perpetual free tier. To keep college project costs near $0:
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem', fontSize: '0.78rem' }}>
                <li><strong>Phase 1:</strong> Use zero-cost local in-memory simulation for all UI and query validation.</li>
                <li><strong>Phase 2 Development:</strong> Deploy a single <code>db.t3.medium</code> instance (approx $0.078/hr) in a single AZ.</li>
                <li><strong>Automated Stop:</strong> Schedule AWS Lambda / EventBridge to stop instances outside college testing hours.</li>
                <li><strong>Billing Alarms:</strong> Configure AWS Budgets with $5.00 threshold alerts.</li>
              </ul>
            </p>
          </div>
        </div>
      </div>

      {/* Schema Comparison: Relational vs Document Model */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Relational (RDBMS) vs Amazon DocumentDB Schema Comparison</h3>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Aspect</th>
                <th>Traditional Relational RDBMS (PostgreSQL / MySQL)</th>
                <th>Amazon DocumentDB (InspectDB Architecture)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Schema Flexibility</td>
                <td>Rigid DDL; requires table migrations and <code>ALTER TABLE</code> for every new sensor/field.</td>
                <td><strong style={{ color: 'var(--color-success-text)' }}>Dynamic Schema:</strong> Different inspection types co-exist in the same collection.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Nested Hierarchy</td>
                <td>Requires foreign keys, join tables (e.g. <code>reports</code>, <code>findings</code>, <code>issues</code>, <code>metrics</code>).</td>
                <td><strong style={{ color: 'var(--color-success-text)' }}>Embedded BSON:</strong> One document contains all findings, sub-issues, and custom metrics.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Read Latency</td>
                <td>Requires multi-table JOIN operations causing CPU overhead on large datasets.</td>
                <td><strong style={{ color: 'var(--color-success-text)' }}>Atomic Document Read:</strong> Single point-in-time document retrieval without joins.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Telemetry Storage</td>
                <td>Requires flat columns or JSONB columns with limited indexing flexibility.</td>
                <td><strong style={{ color: 'var(--color-success-text)' }}>Native BSON Indexing:</strong> Multikey indexes directly on nested paths and arrays.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
