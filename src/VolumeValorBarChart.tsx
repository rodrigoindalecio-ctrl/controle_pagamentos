// Bar chart for Volume vs Valor por tipo de serviço
import React from 'react';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function VolumeValorBarChart({ labels, volumes, valores, colors, title }) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Quantidade',
        data: volumes,
        backgroundColor: colors[0],
        borderRadius: 8,
        yAxisID: 'y',
      },
      {
        label: 'Valor Total (R$)',
        data: valores,
        backgroundColor: colors[1],
        borderRadius: 8,
        yAxisID: 'y1',
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
      title: title
        ? {
            display: true,
            text: title,
          }
        : undefined,
    },
    scales: {
      y: {
        type: "linear" as const,
        position: "left" as const,
        beginAtZero: true,
        title: { display: true, text: 'Quantidade' },
        grid: { drawOnChartArea: false },
      },
      y1: {
        type: "linear" as const,
        position: "right" as const,
        beginAtZero: true,
        title: { display: true, text: 'Valor Total (R$)' },
        grid: { drawOnChartArea: false },
      },
    },
  };
  return (
    <div style={{ width: '100%', height: 260 }}>
      <Bar data={data} options={options} />
    </div>
  );
}
