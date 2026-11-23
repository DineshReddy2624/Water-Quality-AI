import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend
} from 'recharts';

interface ParameterComparisonBarChartProps {
  samples: Array<{
    sample_id: string;
    location_name: string;
    ph: number;
    turbidity: number;
    dissolved_oxygen: number;
    tds: number;
    electrical_conductivity: number;
  }>;
  height?: number;
}

export const ParameterComparisonBarChart: React.FC<ParameterComparisonBarChartProps> = ({
  samples,
  height = 300
}) => {
  const displayData = samples.slice(0, 8).map(s => ({
    name: s.sample_id,
    pH: s.ph,
    Turbidity: s.turbidity,
    DO: s.dissolved_oxygen,
    TDS_div_10: Math.round(s.tds / 10), // Scaled for comparison
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={displayData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94A3B8" />
        <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0F172A',
            border: 'none',
            borderRadius: '8px',
            color: '#FFFFFF',
            fontSize: '12px'
          }}
        />
        <Legend />
        <Bar dataKey="pH" fill="#0D9488" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Turbidity" fill="#F59E0B" radius={[4, 4, 0, 0]} />
        <Bar dataKey="DO" fill="#0284C7" radius={[4, 4, 0, 0]} />
        <Bar dataKey="TDS_div_10" fill="#8B5CF6" name="TDS (x10 mg/L)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
