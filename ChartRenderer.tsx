'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

interface ChartProps {
  type?: 'bar' | 'line';
  data: any;
  title?: string;
}

export default function ChartRenderer({ type = 'bar', data, title }: ChartProps) {
  // Ensure chartData is strictly a valid array
  let chartData: Array<{ name: string; value: number;[key: string]: any }> = [];

  if (Array.isArray(data)) {
    chartData = data;
  } else if (data && typeof data === 'object') {
    chartData = [data]; // If single object was returned, wrap in array
  }

  if (chartData.length === 0) return null;

  return (
    <div className="my-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm w-full">
      {title && (
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {title}
        </h3>
      )}
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff' }}
              />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff' }}
              />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}