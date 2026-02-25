// Bar chart for Ocupação de Agenda por ano
import React from 'react';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function OcupacaoAgendaBarChart({ labels, values, color, title }) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Eventos Fechados',
        data: values,
        backgroundColor: color,
        borderRadius: 8,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: title ? { display: true, text: title } : undefined,
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Quantidade' },
      },
    },
  };
  return (
    <div style={{ width: '100%', height: 220 }}>
      <Bar data={data} options={options} />
    </div>
  );
}
