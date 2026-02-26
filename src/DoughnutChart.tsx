// Simple React wrapper for Chart.js Doughnut
import React from 'react';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

Chart.register(ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
  labels: string[];
  data: number[];
  colors: string[];
  title?: string;
}

export default function DoughnutChart({ labels, data, colors, title }: DoughnutChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors,
        borderWidth: 1,
      },
    ],
  };
  const options = {
    plugins: {
      legend: { display: true, position: 'bottom' as const },
      title: title ? { display: true, text: title } : undefined,
    },
    cutout: '70%',
    responsive: true,
    maintainAspectRatio: false,
  };
  return (
    <div style={{ width: '100%', height: 260 }}>
      {/* @ts-ignore - react-chartjs-2 types can be tricky with chart.js 4 */}
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
