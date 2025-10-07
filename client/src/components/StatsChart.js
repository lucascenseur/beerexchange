import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatsChart = ({ data = [] }) => {
  // Préparer les données pour le graphique
  const chartData = data.map(item => ({
    name: item.productName || item.name || 'Produit',
    ventes: item.totalSales || item.salesCount || 0,
    revenus: item.totalRevenue || 0
  }));

  // Formatage personnalisé du tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.dataKey === 'ventes' ? 'Ventes' : 'Revenus'}: {entry.value}
              {entry.dataKey === 'revenus' && '€'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Si pas de données, afficher un message
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500">
          <p className="text-lg">Aucune donnée disponible</p>
          <p className="text-sm">Les statistiques apparaîtront ici</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="ventes" 
            fill="#3B82F6" 
            radius={[4, 4, 0, 0]}
            name="Ventes"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;
