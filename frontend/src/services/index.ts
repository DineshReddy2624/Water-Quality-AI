import api from './api';
import {
  User, WaterSample, DashboardSummary, DatasetPreview,
  AnomalyRecord, Alert, WaterLocation
} from '../types';

export const authService = {
  login: async (credentials: any) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (data: any) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  }
};

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get('/dashboard/summary');
    return res.data;
  },
  getTrends: async () => {
    const res = await api.get('/dashboard/trends');
    return res.data;
  }
};

export const sampleService = {
  list: async (params?: any): Promise<WaterSample[]> => {
    const res = await api.get('/samples/', { params });
    return res.data;
  },
  getById: async (idOrCode: string | number): Promise<WaterSample> => {
    const res = await api.get(`/samples/${idOrCode}`);
    return res.data;
  },
  create: async (data: any, autoAnalyze = true): Promise<WaterSample> => {
    const res = await api.post(`/samples/?auto_analyze=${autoAnalyze}`, data);
    return res.data;
  },
  update: async (idOrCode: string | number, data: any): Promise<WaterSample> => {
    const res = await api.put(`/samples/${idOrCode}`, data);
    return res.data;
  },
  getNextId: async (): Promise<{ next_sample_id: string }> => {
    const res = await api.get('/samples/next-id');
    return res.data;
  },
  checkId: async (sampleId: string): Promise<{ sample_id: string; is_available: boolean; message: string }> => {
    const res = await api.get(`/samples/check-id/${encodeURIComponent(sampleId)}`);
    return res.data;
  },
  delete: async (idOrCode: string | number) => {
    const res = await api.delete(`/samples/${idOrCode}`);
    return res.data;
  },
  bulkDelete: async (sampleIds: (string | number)[]): Promise<{ deleted_count: number; message: string }> => {
    const res = await api.post('/samples/bulk-delete', { sample_ids: sampleIds });
    return res.data;
  }
};

export const datasetService = {
  upload: async (file: File): Promise<DatasetPreview> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  preview: async (fileId: string): Promise<DatasetPreview> => {
    const res = await api.get(`/datasets/${fileId}/preview`);
    return res.data;
  },
  importData: async (fileId: string, autoAnalyze = true, defaultLocation?: string) => {
    const res = await api.post(`/datasets/${fileId}/import`, {
      file_id: fileId,
      auto_analyze: autoAnalyze,
      default_location: defaultLocation
    });
    return res.data;
  }
};

export const analysisService = {
  analyzeSample: async (sampleId: string | number, modelPreference = 'ensemble') => {
    const res = await api.post(`/analysis/${sampleId}`, { model_preference: modelPreference });
    return res.data;
  },
  batchAnalyze: async (sampleIds?: number[]) => {
    const res = await api.post('/analysis/batch', { sample_ids: sampleIds });
    return res.data;
  },
  getResult: async (sampleId: string | number) => {
    const res = await api.get(`/analysis/${sampleId}/result`);
    return res.data;
  },
  getHistory: async (sampleId: string | number) => {
    const res = await api.get(`/analysis/${sampleId}/history`);
    return res.data;
  },
  getParameterConfigs: async () => {
    const res = await api.get('/analysis/parameters/config');
    return res.data;
  }
};

export const anomalyService = {
  list: async (onlyAnomalies = true, severity?: string) => {
    const res = await api.get('/anomalies/', { params: { only_anomalies: onlyAnomalies, severity } });
    return res.data;
  }
};

export const locationService = {
  list: async (): Promise<WaterLocation[]> => {
    const res = await api.get('/locations/');
    return res.data;
  },
  create: async (data: any): Promise<WaterLocation> => {
    const res = await api.post('/locations/', data);
    return res.data;
  },
  update: async (id: number, data: any): Promise<WaterLocation> => {
    const res = await api.put(`/locations/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/locations/${id}`);
    return res.data;
  }
};

export const alertService = {
  list: async (params?: any): Promise<Alert[]> => {
    const res = await api.get('/alerts/', { params });
    return res.data;
  },
  updateStatus: async (alertId: string | number, status: string): Promise<Alert> => {
    const res = await api.put(`/alerts/${alertId}/status`, { status });
    return res.data;
  }
};

export const reportService = {
  generate: async (data: any) => {
    const res = await api.post('/reports/generate', data);
    return res.data;
  },
  list: async () => {
    const res = await api.get('/reports/');
    return res.data;
  },
  getDownloadUrl: (reportId: string | number) => `/api/reports/${reportId}/download`,
  getSamplePdfUrl: (sampleId: number, analysisId?: number | null) =>
    analysisId ? `/api/reports/sample/${sampleId}/pdf?analysis_id=${analysisId}` : `/api/reports/sample/${sampleId}/pdf`,
  getSampleExcelUrl: (sampleId: number, analysisId?: number | null) =>
    analysisId ? `/api/reports/sample/${sampleId}/excel?analysis_id=${analysisId}` : `/api/reports/sample/${sampleId}/excel`,
  getDatasetExcelUrl: () => `/api/reports/export/excel`
};

export const mlService = {
  getModels: async () => {
    const res = await api.get('/ml/models');
    return res.data;
  },
  train: async (algorithms?: string[]) => {
    const res = await api.post('/ml/train', { algorithms });
    return res.data;
  },
  getEvaluation: async () => {
    const res = await api.get('/ml/evaluation');
    return res.data;
  }
};

export const settingsService = {
  getThresholds: async () => {
    const res = await api.get('/settings/thresholds');
    return res.data;
  },
  updateThresholds: async (thresholds: any) => {
    const res = await api.put('/settings/thresholds', thresholds);
    return res.data;
  }
};

export const userService = {
  list: async (): Promise<User[]> => {
    const res = await api.get('/users/');
    return res.data;
  },
  update: async (id: number, data: any): Promise<User> => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  }
};
