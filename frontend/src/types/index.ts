export interface User {
  id: number;
  email: string;
  full_name?: string;
  role: 'admin' | 'standard';
  is_active: boolean;
  created_at: string;
}

export interface WaterParameter {
  id?: number;
  sample_id?: number;
  ph: number;
  turbidity: number;
  temperature: number;
  dissolved_oxygen: number;
  tds: number;
  electrical_conductivity: number;
  hardness?: number | null;
  chloramines?: number | null;
  sulfate?: number | null;
  organic_carbon?: number | null;
}

export interface ParameterObservation {
  parameter: string;
  name: string;
  value: number;
  unit: string;
  status: 'Normal' | 'Elevated' | 'Low' | 'Critical Low' | 'Critical High' | 'Abnormal';
  optimal_range: string;
  observation: string;
  action_note?: string;
}

export interface Recommendation {
  id?: number;
  title: string;
  description: string;
  category: 'Sampling' | 'Calibration' | 'Investigation' | 'Laboratory' | 'Monitoring';
  priority: 'Low' | 'Medium' | 'High';
}

export interface AnalysisResult {
  id: number;
  sample_id: number;
  predicted_category: 'Good Quality' | 'Moderate Quality' | 'Poor Quality' | 'Potentially Contaminated';
  confidence_score: number;
  model_used: string;
  wqi_score?: number;
  summary?: string;
  observations: ParameterObservation[];
  recommendations: Recommendation[];
  probabilities?: Record<string, number>;
  created_at: string;
}

export interface AnomalyRecord {
  id: number;
  sample_id: number;
  sample_code?: string;
  location_name?: string;
  is_anomaly: boolean;
  anomaly_score: number;
  severity: 'Normal' | 'Low' | 'Medium' | 'High';
  detected_method: string;
  abnormal_parameters: ParameterObservation[];
  notes?: string;
  created_at: string;
}

export interface Alert {
  id: number;
  alert_id: string;
  sample_id: number;
  location_name: string;
  abnormal_parameter: string;
  measured_value: number;
  threshold_value: string;
  severity: 'Low' | 'Medium' | 'High';
  alert_message: string;
  suggested_action: string;
  status: 'Active' | 'Under Review' | 'Resolved';
  created_at: string;
  updated_at: string;
}

export interface WaterLocation {
  id: number;
  name: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
  water_type: string;
  description?: string;
  sample_count: number;
  abnormal_count: number;
  has_repeated_abnormal: boolean;
}

export interface WaterSample {
  id: number;
  sample_id: string;
  water_source_name: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  collection_date: string;
  notes?: string;
  parameters?: WaterParameter;
  analysis?: AnalysisResult;
  anomalies?: AnomalyRecord[];
  alerts?: Alert[];
  recommendations?: Recommendation[];
}

export interface DashboardSummary {
  kpis: {
    total_samples: number;
    total_locations: number;
    good_quality_count: number;
    moderate_quality_count: number;
    poor_quality_count: number;
    potentially_contaminated_count: number;
    total_anomalies: number;
    active_alerts: number;
    under_review_alerts: number;
    resolved_alerts: number;
  };
  averages: {
    ph: number;
    turbidity: number;
    dissolved_oxygen: number;
    tds: number;
    electrical_conductivity: number;
    temperature: number;
  };
}

export interface DatasetPreview {
  filename: string;
  file_id: string;
  row_count: number;
  column_count: number;
  columns: string[];
  missing_values: Record<string, number>;
  duplicate_count: number;
  validation_errors: string[];
  preview_rows: Record<string, any>[];
  preprocessing_summary: {
    original_row_count: number;
    cleaned_row_count: number;
    missing_values_handled: number;
    duplicate_rows_removed: number;
    invalid_values_identified: number;
    outliers_detected: number;
  };
}
