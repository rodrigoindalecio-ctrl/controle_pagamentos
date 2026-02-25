// Simple React wrapper for Chart.js Doughnut
import React from 'react';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

Chart.register(ArcElement, Tooltip, Legend);

export default function DoughnutChart({ labels, data, colors, title }) {
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
      legend: { display: true, position: 'bottom' },
      title: title ? { display: true, text: title } : undefined,
    },
    cutout: '70%',
    responsive: true,
    maintainAspectRatio: false,
  };
  return (
    <div style={{ width: '100%', height: 260 }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
