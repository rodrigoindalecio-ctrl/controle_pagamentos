// GhostLinesChart.tsx
// Gráfico comparativo de anos (Ghost Lines)
import React from 'react';
import { Chart, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

interface GhostLinesChartProps {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor?: string;
    borderDash?: number[];
    fill?: boolean;
    pointRadius?: number;
    pointHoverRadius?: number;
  }>;
  title?: string;
}

export default function GhostLinesChart({ labels, datasets, title }: GhostLinesChartProps) {
  const data = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'bottom' as const },
      title: title ? { display: true, text: title } : undefined,
    },
    scales: {
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        beginAtZero: true,
        title: { display: true, text: 'Receita (R$)' },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: 260 }}>
      <Line data={data} options={options} />
    </div>
  );
}
