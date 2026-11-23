import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface QualityDistributionPieProps {
  data: {
    good: number;
    moderate: number;
    poor: number;
    contaminated: number;
  };
  height?: number;
}

export const QualityDistributionPie: React.FC<QualityDistributionPieProps> = ({ data, height = 260 }) => {
  const chartData = [
    { name: 'Good Quality', value: data.good, color: '#10B981' },
    { name: 'Moderate Quality', value: data.moderate, color: '#F59E0B' },
    { name: 'Poor Quality', value: data.poor, color: '#F97316' },
    { name: 'Potentially Contaminated', value: data.contaminated, color: '#EF4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              borderRadius: '8px',
              border: 'none',
              color: '#F8FAFC',
              fontSize: '12px'
            }}
            formatter={(val: any) => [`${val} samples`, 'Count']}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
