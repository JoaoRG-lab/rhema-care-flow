import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const mockMonthlyData = [
  { mes: 'Jan', pacientes: 12, consultas: 18 },
  { mes: 'Fev', pacientes: 19, consultas: 27 },
  { mes: 'Mar', pacientes: 15, consultas: 22 },
  { mes: 'Abr', pacientes: 23, consultas: 35 },
  { mes: 'Mai', pacientes: 18, consultas: 29 },
  { mes: 'Jun', pacientes: 27, consultas: 41 },
];

const mockDiagnoses = [
  { name: 'Artrite Reumatoide', value: 35 },
  { name: 'Lupus Eritematoso', value: 22 },
  { name: 'Espondilite', value: 18 },
  { name: 'Fibromialgia', value: 15 },
  { name: 'Outros', value: 10 },
];

const mockScoreData = [
  { semana: 'S1', das28: 4.2, meld: 12 },
  { semana: 'S2', das28: 3.8, meld: 10 },
  { semana: 'S3', das28: 3.1, meld: 9 },
  { semana: 'S4', das28: 2.7, meld: 8 },
  { semana: 'S5', das28: 2.4, meld: 7 },
  { semana: 'S6', das28: 2.1, meld: 6 },
];

export default function ReportsPageContent() {
  const [activeTab, setActiveTab] = useState<'overview' | 'diagnosticos' | 'scores'>('overview');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Relatorios Clinicos</h1>
        <span className="text-sm text-gray-400">Dados simulados — aguardando integracao Supabase</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pacientes Ativos', value: '127', color: 'text-blue-400' },
          { label: 'Consultas este mes', value: '41', color: 'text-purple-400' },
          { label: 'Score medio DAS28', value: '2.8', color: 'text-green-400' },
          { label: 'Novos diagnosticos', value: '8', color: 'text-yellow-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-xs">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        {(['overview', 'diagnosticos', 'scores'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm capitalize ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-white font-semibold mb-4">Pacientes e Consultas por Mes</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mes" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
              <Legend />
              <Bar dataKey="pacientes" fill="#0ea5e9" name="Pacientes" />
              <Bar dataKey="consultas" fill="#8b5cf6" name="Consultas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'diagnosticos' && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-white font-semibold mb-4">Distribuicao de Diagnosticos</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockDiagnoses}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {mockDiagnoses.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'scores' && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-white font-semibold mb-4">Evolucao de Scores Clinicos</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockScoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="semana" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
              <Legend />
              <Line type="monotone" dataKey="das28" stroke="#0ea5e9" name="DAS28" strokeWidth={2} />
              <Line type="monotone" dataKey="meld" stroke="#10b981" name="MELD Score" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
