// GhostLinesChart.tsx
// Gráfico comparativo de anos (Ghost Lines)
import React from 'react';
import { Chart, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, ChartDataLabels);

interface GhostLinesChartProps {
  labels: string[];
  datasets: Array<{
    label: string;
    data: (number | null)[];
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
  const currentYear = new Date().getFullYear().toString();
  const lastYear = (Number(currentYear) - 1).toString();
  const prevLastYear = (Number(currentYear) - 2).toString();

  const data = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' as const },
      title: title ? { display: true, text: title } : undefined,
      datalabels: {
        align: (context: any) => {
          const label = context.dataset.label;
          if (label === currentYear) return 'top';
          if (label === lastYear) return 'bottom';
          return 'right'; // 2024
        },
        anchor: (context: any) => {
          const label = context.dataset.label;
          if (label === currentYear) return 'end';
          if (label === lastYear) return 'start';
          return 'center'; // 2024
        },
        offset: 6,
        color: (context: any) => context.dataset.borderColor,
        font: { size: 9, weight: 'bold' as const },
        formatter: (value: number | null) => {
          if (value === null || value === 0) return null;
          return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value;
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.03)',
        },
        title: { display: true, text: 'Receita (R$)' },
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    // Prevent drawing lines where data is null
    spanGaps: false,
  };

  return (
    <div className="w-full h-[320px] pt-4">
      <Line data={data} options={options} />
    </div>
  );
}
