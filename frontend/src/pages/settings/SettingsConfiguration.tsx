import React, { useEffect, useState } from 'react';
import { settingsService } from '../../services';
import { Sliders, Save, RotateCcw, CheckCircle2, ShieldAlert } from 'lucide-react';

export const SettingsConfiguration: React.FC = () => {
  const [thresholds, setThresholds] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await settingsService.getThresholds();
        setThresholds(data.thresholds || {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleFieldChange = (paramKey: string, field: string, value: any) => {
    setThresholds((prev: any) => ({
      ...prev,
      [paramKey]: {
        ...prev[paramKey],
        [field]: value === '' ? null : Number(value)
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMessage(null);
    try {
      await settingsService.updateThresholds(thresholds);
      setSavedMessage('Screening thresholds updated successfully!');
      setTimeout(() => setSavedMessage(null), 4000);
    } catch (e) {
      alert('Failed to update thresholds');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Screening Thresholds & Configuration
          </h1>
          <p className="text-xs text-slate-500">
            Configure optimal and tolerable water quality parameter limits according to specific regional watershed standards.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md shadow-teal-500/20 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {savedMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Thresholds Grid */}
      <div className="space-y-4">
        {Object.entries(thresholds).map(([key, spec]: [string, any]) => (
          <div key={key} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {spec.name} ({spec.unit})
                </h3>
                <p className="text-xs text-slate-500">{spec.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Optimal Min ({spec.unit})</label>
                <input
                  type="number"
                  step="any"
                  value={spec.optimal_min ?? ''}
                  onChange={(e) => handleFieldChange(key, 'optimal_min', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">Optimal Max ({spec.unit})</label>
                <input
                  type="number"
                  step="any"
                  value={spec.optimal_max ?? ''}
                  onChange={(e) => handleFieldChange(key, 'optimal_max', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">Tolerable Min ({spec.unit})</label>
                <input
                  type="number"
                  step="any"
                  value={spec.tolerable_min ?? ''}
                  onChange={(e) => handleFieldChange(key, 'tolerable_min', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">Tolerable Max ({spec.unit})</label>
                <input
                  type="number"
                  step="any"
                  value={spec.tolerable_max ?? ''}
                  onChange={(e) => handleFieldChange(key, 'tolerable_max', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
