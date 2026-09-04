import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  SeverityDistribution,
  PriorityDistribution,
  DepartmentWorkload,
} from '../../services/contracts/analytics.contract';

export const DefectDistributionChart: React.FC<{
  data?: { name: string; value: number; color: string }[];
  height?: number;
}> = ({ data, height = 240 }) => {
  const defaultData = [
    { name: 'Longitudinal Crack', value: 32, color: '#D97706' },
    { name: 'Pothole', value: 28, color: '#DC2626' },
    { name: 'Transverse Crack', value: 18, color: '#2563EB' },
    { name: 'Alligator Crack', value: 14, color: '#9333EA' },
    { name: 'Other Corruption', value: 8, color: '#059669' },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`defect-cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderRadius: '0.5rem',
              border: '1px solid #E2E8F0',
              fontSize: '12px',
            }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SeverityChart: React.FC<{ data: SeverityDistribution[]; height?: number }> = ({
  data,
  height = 240,
}) => {
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={55}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderRadius: '0.5rem',
              border: '1px solid #E2E8F0',
              fontSize: '12px',
            }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PriorityChart: React.FC<{ data: PriorityDistribution[]; height?: number }> = ({
  data,
  height = 240,
}) => {
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
          <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderRadius: '0.5rem',
              border: '1px solid #E2E8F0',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DepartmentWorkloadChart: React.FC<{ data: DepartmentWorkload[]; height?: number }> = ({
  data,
  height = 260,
}) => {
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} interval={0} />
          <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderRadius: '0.5rem',
              border: '1px solid #E2E8F0',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Bar dataKey="active" name="Active Repairs" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" name="Resolved Cases" fill="#0F3870" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
