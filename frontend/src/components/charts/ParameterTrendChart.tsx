import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend
} from 'recharts';

interface ParameterTrendChartProps {
  data: Array<{
    date: string;
    sample_id?: string;
    ph?: number;
    turbidity?: number;
    dissolved_oxygen?: number;
    tds?: number;
    electrical_conductivity?: number;
    temperature?: number;
    wqi?: number;
  }>;
  parameter?: 'ph' | 'turbidity' | 'dissolved_oxygen' | 'tds' | 'electrical_conductivity' | 'temperature' | 'wqi';
  height?: number;
}

const paramConfig = {
  ph: { name: 'pH Level', unit: '', color: '#0D9488', domain: [0, 14] },
  turbidity: { name: 'Turbidity', unit: 'NTU', color: '#F59E0B', domain: [0, 'auto'] },
  dissolved_oxygen: { name: 'Dissolved Oxygen', unit: 'mg/L', color: '#0284C7', domain: [0, 16] },
  tds: { name: 'Total Dissolved Solids', unit: 'mg/L', color: '#8B5CF6', domain: [0, 'auto'] },
  electrical_conductivity: { name: 'Conductivity', unit: 'µS/cm', color: '#EC4899', domain: [0, 'auto'] },
  temperature: { name: 'Temperature', unit: '°C', color: '#F97316', domain: [0, 50] },
  wqi: { name: 'Water Quality Index', unit: '/100', color: '#10B981', domain: [0, 100] }
};

export const ParameterTrendChart: React.FC<ParameterTrendChartProps> = ({
  data,
  parameter = 'wqi',
  height = 300
}) => {
  const config = paramConfig[parameter] || paramConfig.wqi;

  return (
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${parameter}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={config.color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={config.color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickLine={false}
            stroke="#94A3B8"
            tickFormatter={(val) => val.split(' ')[0]}
          />
          <YAxis
            domain={config.domain as any}
            tick={{ fontSize: 11 }}
            tickLine={false}
            stroke="#94A3B8"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              border: 'none',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '12px'
            }}
            formatter={(val: any) => [`${val} ${config.unit}`, config.name]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Area
            type="monotone"
            dataKey={parameter}
            stroke={config.color}
            strokeWidth={2.5}
            fillOpacity={1}
            fill={`url(#grad-${parameter})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
