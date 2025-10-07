import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const PriceChart = ({ priceHistory, currentPrice, height = 200 }) => {
  // Préparer les données pour le graphique
  const chartData = priceHistory?.map((point, index) => ({
    time: format(new Date(point.timestamp), 'HH:mm', { locale: fr }),
    price: point.price,
    sales: point.salesCount,
    index: index
  })) || [];

  // Couleur de la ligne basée sur la tendance
  const getLineColor = () => {
    if (chartData.length < 2) return '#6B7280';
    
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    
    if (lastPrice > firstPrice) return '#10B981'; // Vert pour hausse
    if (lastPrice < firstPrice) return '#EF4444'; // Rouge pour baisse
    return '#6B7280'; // Gris pour stable
  };

  // Formatage personnalisé du tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{`Heure: ${label}`}</p>
          <p className="text-green-600 font-medium">
            {`Prix: ${new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR'
            }).format(data.price)}`}
          </p>
          <p className="text-blue-600 text-sm">
            {`Ventes: ${data.sales}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Formatage de l'axe Y (prix)
  const formatYAxis = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Si pas assez de données, afficher un message
  if (!priceHistory || priceHistory.length < 2) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        style={{ height: height }}
      >
        <div className="text-center text-gray-500">
          <p className="text-sm">Pas assez de données</p>
          <p className="text-xs">pour afficher le graphique</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="time" 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxis}
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke={getLineColor()}
            strokeWidth={3}
            dot={{ fill: getLineColor(), strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: getLineColor(), strokeWidth: 2 }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Légende avec prix actuel */}
      <div className="mt-2 text-center">
        <span className="text-sm text-gray-600">
          Prix actuel: 
          <span className="font-semibold ml-1" style={{ color: getLineColor() }}>
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR'
            }).format(currentPrice)}
          </span>
        </span>
      </div>
    </div>
  );
};

export default PriceChart;
