import { QueryPreset, QueryCondition } from '../types';

export interface FieldTypeDefinition {
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'categorical';
  allowedOperators: { id: string; label: string }[];
  defaultOperator: string;
  placeholder: string;
}

export const FIELD_TYPE_OPERATORS: Record<string, FieldTypeDefinition> = {
  categorical: {
    type: 'categorical',
    allowedOperators: [
      { id: 'equals', label: 'Equals (=)' },
      { id: 'not_equals', label: 'Not Equals (≠)' },
      { id: 'in', label: 'In List ($in)' },
      { id: 'not_in', label: 'Not In List ($nin)' },
      { id: 'exists', label: 'Field Exists ($exists)' }
    ],
    defaultOperator: 'equals',
    placeholder: 'e.g. high, critical, open, passed'
  },
  string: {
    type: 'string',
    allowedOperators: [
      { id: 'equals', label: 'Equals (=)' },
      { id: 'not_equals', label: 'Not Equals (≠)' },
      { id: 'contains', label: 'Contains (Regex $options: i)' },
      { id: 'starts_with', label: 'Starts With (^)' },
      { id: 'ends_with', label: 'Ends With ($)' },
      { id: 'in', label: 'In List ($in)' },
      { id: 'exists', label: 'Field Exists ($exists)' }
    ],
    defaultOperator: 'contains',
    placeholder: 'e.g. Building A, Substation'
  },
  number: {
    type: 'number',
    allowedOperators: [
      { id: 'equals', label: 'Equals (=)' },
      { id: 'not_equals', label: 'Not Equals (≠)' },
      { id: 'greater_than', label: 'Greater Than (>)' },
      { id: 'greater_than_or_equal', label: 'Greater Than or Equal (≥)' },
      { id: 'less_than', label: 'Less Than (<)' },
      { id: 'less_than_or_equal', label: 'Less Than or Equal (≤)' },
      { id: 'exists', label: 'Field Exists ($exists)' }
    ],
    defaultOperator: 'greater_than',
    placeholder: 'e.g. 13.8, 50, 1000'
  },
  boolean: {
    type: 'boolean',
    allowedOperators: [
      { id: 'is_true', label: 'Is True ($eq: true)' },
      { id: 'is_false', label: 'Is False ($eq: false)' },
      { id: 'exists', label: 'Field Exists ($exists)' }
    ],
    defaultOperator: 'is_true',
    placeholder: 'true / false'
  },
  date: {
    type: 'date',
    allowedOperators: [
      { id: 'equals', label: 'On Date (=)' },
      { id: 'greater_than_or_equal', label: 'After or On (≥)' },
      { id: 'less_than_or_equal', label: 'Before or On (≤)' },
      { id: 'exists', label: 'Field Exists ($exists)' }
    ],
    defaultOperator: 'greater_than_or_equal',
    placeholder: 'YYYY-MM-DD'
  },
  array: {
    type: 'array',
    allowedOperators: [
      { id: 'contains', label: 'Contains Element' },
      { id: 'array_size', label: 'Array Size ($size)' },
      { id: 'exists', label: 'Array Exists ($exists)' }
    ],
    defaultOperator: 'exists',
    placeholder: 'Array condition'
  },
  object: {
    type: 'object',
    allowedOperators: [
      { id: 'exists', label: 'Object Exists ($exists)' }
    ],
    defaultOperator: 'exists',
    placeholder: 'Subdocument object'
  }
};

// Map specific field paths to their exact semantic types
export const KNOWN_FIELD_TYPE_MAP: Record<string, string> = {
  // Categorical Enums
  'overall_severity': 'categorical',
  'status': 'categorical',
  'category': 'categorical',
  'findings.severity': 'categorical',
  'findings.category': 'categorical',
  'findings.issues.status': 'categorical',
  'findings.issues.severity': 'categorical',

  // Strings
  'id': 'string',
  'title': 'string',
  'inspector_name': 'string',
  'location': 'string',
  'description': 'string',
  'findings.finding_id': 'string',
  'findings.description': 'string',
  'findings.location_details': 'string',
  'findings.issues.issue_id': 'string',
  'findings.issues.title': 'string',
  'findings.issues.code_reference': 'string',
  'findings.issues.notes': 'string',
  'custom_fields.key': 'string',
  'custom_fields.value': 'string',

  // Numbers
  'findings.custom_metrics.measured_temp_c': 'number',
  'findings.custom_metrics.ambient_temp_c': 'number',
  'findings.custom_metrics.delta_t_c': 'number',
  'findings.custom_metrics.ground_resistance_ohms': 'number',
  'dynamic_attributes.electrical_telemetry.phases.phase_a.voltage_kv': 'number',
  'dynamic_attributes.electrical_telemetry.phases.phase_b.voltage_kv': 'number',
  'dynamic_attributes.electrical_telemetry.phases.phase_c.voltage_kv': 'number',
  'dynamic_attributes.crane_telemetry.boom_angle_degrees': 'number',
  'dynamic_attributes.crane_telemetry.hydraulic_main_pressure_psi': 'number',
  'dynamic_attributes.bridge_sensor_array.pier_3_tilt_deg': 'number',
  'dynamic_attributes.chiller_plant_metrics.delta_t_chilled_water_f': 'number',

  // Booleans
  'is_sample': 'boolean',
  'dynamic_attributes.fire_safety_matrix.sprinkler_flow_test_passed': 'boolean',

  // Dates
  'inspection_date': 'date',
  'created_at': 'date',
  'updated_at': 'date',

  // Arrays & Objects
  'findings': 'array',
  'findings.issues': 'array',
  'custom_fields': 'array',
  'dynamic_attributes.electrical_telemetry': 'object',
  'dynamic_attributes.crane_telemetry': 'object',
  'dynamic_attributes.bridge_sensor_array': 'object'
};

export const QUERY_PRESETS: QueryPreset[] = [
  {
    id: 'high-severity-findings',
    name: 'High Severity Findings',
    description: 'Finds reports containing at least one nested finding with High severity.',
    complexity: 'Moderate',
    fields: ['findings.severity'],
    expected_path: 'findings[].severity',
    explanation: 'Searches the findings array and returns reports containing at least one subdocument where severity equals "high".',
    match_type: 'and',
    conditions: [
      { field: 'findings.severity', operator: 'equals', value: 'high', value_type: 'categorical' }
    ]
  },
  {
    id: 'critical-findings',
    name: 'Critical Severity Findings',
    description: 'Finds reports containing urgent Critical severity findings requiring immediate intervention.',
    complexity: 'Moderate',
    fields: ['findings.severity'],
    expected_path: 'findings[].severity',
    explanation: 'Scans the findings array for critical violations across all inspection domains.',
    match_type: 'and',
    conditions: [
      { field: 'findings.severity', operator: 'equals', value: 'critical', value_type: 'categorical' }
    ]
  },
  {
    id: 'open-electrical-issues',
    name: 'Open Electrical Issues',
    description: 'Finds reports in the Electrical category that contain unaddressed (open) issues.',
    complexity: 'Complex',
    fields: ['category', 'findings.issues.status'],
    expected_path: 'category AND findings[].issues[].status',
    explanation: 'Combines a root-level category filter with deep nested array matching into the issues array.',
    match_type: 'and',
    conditions: [
      { field: 'category', operator: 'equals', value: 'Electrical', value_type: 'categorical' },
      { field: 'findings.issues.status', operator: 'equals', value: 'open', value_type: 'categorical' }
    ]
  },
  {
    id: 'high-findings-with-open-issues',
    name: 'High Findings with Open Issues ($elemMatch)',
    description: 'Finds reports where the same finding is high severity and still has an open issue.',
    complexity: 'Advanced',
    fields: ['findings.severity', 'findings.issues.status'],
    expected_path: 'findings[] { severity, issues[].status }',
    explanation: 'Both conditions target the findings array, so they are wrapped in $elemMatch and must hold for one finding, not two different ones.',
    match_type: 'and',
    conditions: [
      { field: 'findings.severity', operator: 'equals', value: 'high', value_type: 'categorical' },
      { field: 'findings.issues.status', operator: 'equals', value: 'open', value_type: 'categorical' }
    ]
  },
  {
    id: 'failed-safety-checks',
    name: 'Failed Safety Checks',
    description: 'Finds inspection reports with overall status marked as failed.',
    complexity: 'Simple',
    fields: ['status'],
    expected_path: 'status',
    explanation: 'Direct root-level query on inspection status field.',
    match_type: 'and',
    conditions: [
      { field: 'status', operator: 'equals', value: 'failed', value_type: 'categorical' }
    ]
  },
  {
    id: 'building-a-reports',
    name: 'Building A Reports',
    description: 'Finds reports conducted in or around Building A facilities.',
    complexity: 'Simple',
    fields: ['location'],
    expected_path: 'location',
    explanation: 'Uses case-insensitive substring regex matching on the location field.',
    match_type: 'and',
    conditions: [
      { field: 'location', operator: 'contains', value: 'Building A', value_type: 'string' }
    ]
  },
  {
    id: 'nested-electrical-telemetry',
    name: 'Reports with Nested Electrical Telemetry',
    description: 'Identifies documents containing the variable-schema electrical telemetry subdocument.',
    complexity: 'Moderate',
    fields: ['dynamic_attributes.electrical_telemetry'],
    expected_path: 'dynamic_attributes.electrical_telemetry',
    explanation: 'Uses $exists operator to locate documents containing domain-specific telemetry.',
    match_type: 'and',
    conditions: [
      { field: 'dynamic_attributes.electrical_telemetry', operator: 'exists', value: true, value_type: 'object' }
    ]
  },
  {
    id: 'heavy-equipment-reports',
    name: 'Heavy Equipment Reports',
    description: 'Finds machinery and heavy equipment inspection audits.',
    complexity: 'Simple',
    fields: ['category'],
    expected_path: 'category',
    explanation: 'Root-level category filter on Equipment audits.',
    match_type: 'and',
    conditions: [
      { field: 'category', operator: 'equals', value: 'Equipment', value_type: 'categorical' }
    ]
  },
  {
    id: 'high-temp-readings',
    name: 'High Temperature Readings (>50°C)',
    description: 'Finds reports where thermal imaging detected measured temperatures exceeding 50°C.',
    complexity: 'Complex',
    fields: ['findings.custom_metrics.measured_temp_c'],
    expected_path: 'findings[].custom_metrics.measured_temp_c',
    explanation: 'Navigates nested subdocument custom_metrics within the findings array using numeric comparison.',
    match_type: 'and',
    conditions: [
      { field: 'findings.custom_metrics.measured_temp_c', operator: 'greater_than', value: 50, value_type: 'number' }
    ]
  },
  {
    id: 'multiple-findings',
    name: 'Reports with Exactly Two Findings',
    description: 'Finds reports whose findings array holds exactly two items.',
    complexity: 'Moderate',
    fields: ['findings'],
    expected_path: 'findings',
    explanation: 'Uses $size, which matches an exact array length.',
    match_type: 'and',
    conditions: [
      { field: 'findings', operator: 'array_size', value: 2, value_type: 'array' }
    ]
  },
  {
    id: 'resolved-plus-open-issues',
    name: 'Reports with Open or In-Progress Issues',
    description: 'Finds reports that have active issues matching open or in_progress states.',
    complexity: 'Moderate',
    fields: ['findings.issues.status'],
    expected_path: 'findings[].issues[].status',
    explanation: 'Uses $in array matching to retrieve documents with active remediation tasks.',
    match_type: 'and',
    conditions: [
      { field: 'findings.issues.status', operator: 'in', value: 'open, in_progress', value_type: 'categorical' }
    ]
  },
  {
    id: 'deeply-nested-telemetry',
    name: 'Deeply Nested Telemetry (Phase A ≥ 13.8 kV)',
    description: 'Follows a five-part dot-notation path into the electrical telemetry subdocument.',
    complexity: 'Advanced',
    fields: ['dynamic_attributes.electrical_telemetry.phases.phase_a.voltage_kv'],
    expected_path: 'dynamic_attributes.electrical_telemetry.phases.phase_a.voltage_kv',
    explanation: 'Demonstrates Amazon DocumentDB dot notation traversing deep polymorphic structures without schema migrations.',
    match_type: 'and',
    conditions: [
      { field: 'dynamic_attributes.electrical_telemetry.phases.phase_a.voltage_kv', operator: 'greater_than_or_equal', value: 13.8, value_type: 'number' }
    ]
  },
  {
    id: 'variable-schema-crane',
    name: 'Variable-Schema Crane Telemetry (Boom Angle > 40°)',
    description: 'Finds crane inspections where boom operating angle exceeds 40 degrees.',
    complexity: 'Complex',
    fields: ['dynamic_attributes.crane_telemetry.boom_angle_degrees'],
    expected_path: 'dynamic_attributes.crane_telemetry.boom_angle_degrees',
    explanation: 'Demonstrates querying attributes present only on heavy machinery reports while gracefully returning false for other domains.',
    match_type: 'and',
    conditions: [
      { field: 'dynamic_attributes.crane_telemetry.boom_angle_degrees', operator: 'greater_than', value: 40, value_type: 'number' }
    ]
  }
];

export const EDUCATIONAL_DOCUMENTDB_POINTS = [
  {
    title: 'Polymorphic Variable Schemas',
    content: 'Unlike relational databases requiring rigid DDL ALTER TABLE commands or sparse null columns, Amazon DocumentDB stores rich BSON documents where Electrical, Crane, and Fire reports coexist in the same collection with domain-specific telemetry.'
  },
  {
    title: 'Dot Notation Navigation',
    content: 'DocumentDB traverses nested sub-objects seamlessly using dot notation (e.g., dynamic_attributes.electrical_telemetry.phases.phase_a.voltage_kv) allowing targeted queries without JOIN operations.'
  },
  {
    title: 'Array Handling with $elemMatch',
    content: 'When querying nested arrays like findings[], $elemMatch guarantees that multiple criteria (e.g. severity = "high" AND status = "open") are satisfied by the SAME array element, eliminating false positive cross-element matches.'
  },
  {
    title: 'High-Performance Multikey Indexing',
    content: 'DocumentDB supports multikey indexes on array fields (e.g. db.inspection_reports.createIndex({"findings.severity": 1})) so queries on nested findings can use an index instead of scanning every document.'
  }
];
