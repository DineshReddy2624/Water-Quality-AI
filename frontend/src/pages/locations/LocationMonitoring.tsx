import React, { useEffect, useState } from 'react';
import { locationService } from '../../services';
import { WaterLocation } from '../../types';
import { Compass, Plus, MapPin, AlertTriangle, CheckCircle, Edit, Trash2 } from 'lucide-react';

export const LocationMonitoring: React.FC = () => {
  const [locations, setLocations] = useState<WaterLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState<WaterLocation | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [waterType, setWaterType] = useState('lake');
  const [description, setDescription] = useState('');

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const data = await locationService.list();
      setLocations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleOpenAdd = () => {
    setEditingLoc(null);
    setName('');
    setLocationName('');
    setLatitude('');
    setLongitude('');
    setWaterType('lake');
    setDescription('');
    setShowModal(true);
  };

  const handleOpenEdit = (loc: WaterLocation) => {
    setEditingLoc(loc);
    setName(loc.name);
    setLocationName(loc.location_name);
    setLatitude(loc.latitude ? String(loc.latitude) : '');
    setLongitude(loc.longitude ? String(loc.longitude) : '');
    setWaterType(loc.water_type);
    setDescription(loc.description || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      location_name: locationName,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      water_type: waterType,
      description: description || undefined
    };

    try {
      if (editingLoc) {
        await locationService.update(editingLoc.id, payload);
      } else {
        await locationService.create(payload);
      }
      setShowModal(false);
      fetchLocations();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save location');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this monitoring location?')) {
      try {
        await locationService.delete(id);
        fetchLocations();
      } catch (err) {
        alert('Failed to delete location.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Water Source & Location Management
          </h1>
          <p className="text-xs text-slate-500">
            Maintain water catchments, baseline GPS coordinates, and track locations exhibiting repeated abnormal readings.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-500/20"
        >
          <Plus className="h-4 w-4" /> Add Monitoring Station
        </button>
      </div>

      {/* Locations Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Station / Source Name</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Coordinates</th>
                <th className="py-3 px-4">Sample Count</th>
                <th className="py-3 px-4">Anomalies</th>
                <th className="py-3 px-4">Repeated Flag</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {loc.name}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {loc.location_name}
                  </td>
                  <td className="py-3 px-4 capitalize">
                    {loc.water_type}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {loc.latitude && loc.longitude ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}` : 'Manual'}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {loc.sample_count}
                  </td>
                  <td className="py-3 px-4 font-bold text-rose-600">
                    {loc.abnormal_count}
                  </td>
                  <td className="py-3 px-4">
                    {loc.has_repeated_abnormal ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                        <AlertTriangle className="h-3 w-3" /> Repeated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <CheckCircle className="h-3 w-3" /> Stable
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(loc)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-600 dark:text-slate-300"
                        title="Edit Location"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(loc.id)}
                        className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                        title="Delete Location"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingLoc ? 'Edit Monitoring Station' : 'Add Monitoring Station'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Water Source Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Location / Zone *</label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Water Body Type</label>
                <select
                  value={waterType}
                  onChange={(e) => setWaterType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 capitalize"
                >
                  <option value="lake">Lake</option>
                  <option value="river">River</option>
                  <option value="reservoir">Reservoir</option>
                  <option value="groundwater">Groundwater</option>
                  <option value="industrial">Industrial Canal</option>
                  <option value="other">Other / Runoff</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-500 shadow-sm"
                >
                  Save Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
