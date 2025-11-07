

import React, { useEffect, useState } from 'react';
import { apiGetMaterials, apiGetStockMovements, apiGetAiSummary } from '../services/api';
import { Material, StockMovement } from '../types';
import { SparklesIcon } from '../components/icons/Icons';

const StatCard: React.FC<{ title: string; value: string | number; color: string; borderColor: string }> = ({ title, value, color, borderColor }) => (
    <div className={`bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 border-t-4 ${borderColor}`}>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
);

const CATEGORY_COLORS: { [key: string]: string } = {
    'estrutural': '#38bdf8', // sky-400
    'acabamento': '#34d399', // emerald-400
    'hidráulico': '#fbbf24', // amber-400
    'elétrico': '#f87171', // red-400
    'outros': '#94a3b8', // slate-400,
    'entrada': '#22c55e', // green-500
    'saida': '#ef4444', // red-500
};

const PieChart: React.FC<{ data: { [key: string]: number } }> = ({ data }) => {
    // Fix: Cast value to a number to prevent type errors in the reduce function.
    const total = Object.values(data).reduce((sum, value) => sum + Number(value), 0);
    if (total === 0) {
        return <p className="text-center text-slate-400 py-4">Sem dados para exibir.</p>;
    }
    
    const sortedData = Object.entries(data).sort(([, a], [, b]) => Number(b) - Number(a));

    let cumulativeAngle = -90;
    const slices = sortedData.map(([key, value]) => {
        // Fix: Cast value to a number for the arithmetic operation.
        const angle = (Number(value) / total) * 360;
        const startAngleRad = (cumulativeAngle) * Math.PI / 180;
        const endAngleRad = ((cumulativeAngle + angle)) * Math.PI / 180;

        const x1 = 50 + 40 * Math.cos(startAngleRad);
        const y1 = 50 + 40 * Math.sin(startAngleRad);
        const x2 = 50 + 40 * Math.cos(endAngleRad);
        const y2 = 50 + 40 * Math.sin(endAngleRad);
        
        const largeArcFlag = angle > 180 ? 1 : 0;

        const pathData = `M 50,50 L ${x1},${y1} A 40,40 0 ${largeArcFlag},1 ${x2},${y2} Z`;
        cumulativeAngle += angle;
        return <path key={key} d={pathData} fill={CATEGORY_COLORS[key.toLowerCase()] || '#64748b'} />;
    });

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
            <svg viewBox="0 0 100 100" className="w-48 h-48 md:w-56 md:h-56">
                {slices}
            </svg>
            <div className="flex flex-col space-y-2">
                {sortedData.map(([key, value]) => (
                    <div key={key} className="flex items-center text-sm">
                        <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: CATEGORY_COLORS[key.toLowerCase()] || '#64748b' }}></span>
                        <span className="font-semibold text-slate-300 capitalize">{key}:</span>
                        <span className="ml-2 text-slate-400">{Number(value)} ({((Number(value) / total) * 100).toFixed(1)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const monthOrder = ["set", "out", "nov", "dez", "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago"];
const fullMonthNames: { [key: string]: string } = {
  'set': 'setembro',
  'out': 'outubro',
};

const BarChart: React.FC<{ data: { [key: string]: number }, title: string }> = ({ data, title }) => {
    const sortedEntries = Object.entries(data).sort(([a], [b]) => {
        const monthA = a.split('/')[0].toLowerCase();
        const monthB = b.split('/')[0].toLowerCase();
        return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
    });

    if (sortedEntries.length === 0) {
        return (
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 border-t-4 border-emerald-500">
                 <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
                 <p className="text-center text-slate-400 py-4 h-64 flex items-center justify-center">Sem dados para exibir.</p>
            </div>
        );
    }
    const maxValue = Math.max(...sortedEntries.map(([, value]) => Number(value)));
    
    return (
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 border-t-4 border-emerald-500">
            <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
            <div className="flex justify-around items-end h-64 pt-4 border-l border-b border-slate-600">
                {sortedEntries.map(([label, value]) => {
                    const monthKey = label.split('/')[0].toLowerCase();
                    const displayLabel = fullMonthNames[monthKey] || label;
                    return (
                        <div key={label} className="flex flex-col items-center h-full w-full justify-end px-2 group">
                             <div className="text-xs text-white font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{String(value)}</div>
                             {/* Fix: Cast value to a number for the arithmetic operation in the style property. */}
                             <div className="w-full bg-gradient-to-t from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 rounded-t-md transition-all" style={{ height: `${(Number(value) / maxValue) * 100}%` }}></div>
                             <div className="text-xs text-slate-400 mt-2 whitespace-nowrap capitalize">{displayLabel}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const getStatusColor = (status: string) => {
    if (status === 'ESTOQUE BAIXO!') return 'text-red-400';
    if (status === 'ESTOQUE RAZOÁVEL') return 'text-yellow-400';
    return 'text-green-400';
};

const getRecommendationColor = (rec: string) => {
    if (rec === 'COMPRA IMEDIATA') return 'text-red-400 font-bold';
    if (rec === 'TALVEZ') return 'text-yellow-400';
    return 'text-slate-300';
};


const DashboardPage: React.FC = () => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [aiSummary, setAiSummary] = useState('');
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [materialsData, movementsData] = await Promise.all([
                    apiGetMaterials(),
                    apiGetStockMovements()
                ]);

                materialsData.sort((a, b) => a.description.localeCompare(b.description));
                setMaterials(materialsData);
                setMovements(movementsData);

                setAiLoading(true);
                const summary = await apiGetAiSummary(materialsData);
                setAiSummary(summary);
                

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
                setAiSummary("Não foi possível obter a análise da IA no momento.");
            } finally {
                setLoading(false);
                setAiLoading(false);
            }
        };
        fetchData();
    }, []);

    const itemsBelowMinStock = materials.filter(m => m.currentStock < m.minStock);
    const totalItems = materials.length;
    const totalStockValue = materials.reduce((acc, m) => acc + m.stockValue, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const categoryDistribution = materials.reduce((acc, material) => {
        acc[material.category] = (acc[material.category] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    const movementTypeDistribution = movements.reduce((acc, movement) => {
        const typeName = movement.type === 'entrada' ? 'Entrada' : 'Saida';
        acc[typeName] = (acc[typeName] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });
    
    const invoicesPerMonth = movements.reduce((acc, movement) => {
        if(movement.docRef) {
            const month = new Date(movement.movedAt).toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
            acc[month] = (acc[month] || 0) + 1;
        }
        return acc;
    }, {} as { [key: string]: number });


    if (loading) {
        return <div className="text-center p-8">Carregando dados...</div>
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total de Itens Cadastrados" value={totalItems} color="text-teal-400" borderColor="border-teal-400" />
                <StatCard title="Itens Abaixo do Mínimo" value={itemsBelowMinStock.length} color={itemsBelowMinStock.length > 0 ? "text-red-400" : "text-green-400"} borderColor={itemsBelowMinStock.length > 0 ? "border-red-400" : "border-green-400"} />
                <StatCard title="Valor Total do Estoque" value={totalStockValue} color="text-sky-400" borderColor="border-sky-400" />
            </div>

            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-fuchsia-500/40 shadow-[0_0_15px_rgba(192,38,211,0.2)]">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <SparklesIcon className="h-6 w-6 mr-3 text-fuchsia-400" />
                    Análise IA
                </h2>
                {aiLoading ? <p className="text-slate-400 animate-pulse">Analisando dados do estoque...</p> : <p className="text-slate-300">{aiSummary}</p>}
            </div>

            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                <h2 className="text-xl font-bold text-white p-6 border-b border-slate-700">Alerta de Estoque Mínimo</h2>
                {itemsBelowMinStock.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-300">
                            <thead className="text-xs text-slate-300 uppercase bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Descrição</th>
                                    <th scope="col" className="px-6 py-3">Fornecedor</th>
                                    <th scope="col" className="px-6 py-3">Estoque</th>
                                    <th scope="col" className="px-6 py-3">Preço</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3">Compra</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {itemsBelowMinStock.map(item => (
                                    <tr key={item.id} className="bg-slate-800 hover:bg-slate-700/50">
                                        <td className="px-6 py-4 font-medium text-white">{item.description}</td>
                                        <td className="px-6 py-4">{item.supplier.name}</td>
                                        <td className="px-6 py-4 font-bold text-red-400">{item.currentStock}</td>
                                        <td className="px-6 py-4">{item.avgCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td className={`px-6 py-4 font-semibold ${getStatusColor(item.controlStatus)}`}>{item.controlStatus}</td>
                                        <td className={`px-6 py-4 ${getRecommendationColor(item.purchaseRecommendation)}`}>{item.purchaseRecommendation}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="p-6 text-slate-400">Nenhum item abaixo do estoque mínimo. Ótimo trabalho!</p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 border-t-4 border-indigo-500">
                    <h2 className="text-xl font-bold text-white mb-4">Distribuição por Categoria</h2>
                    <PieChart data={categoryDistribution} />
                </div>
                 <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 border-t-4 border-amber-500">
                    <h2 className="text-xl font-bold text-white mb-4">Movimentações (Entrada/Saída)</h2>
                    <PieChart data={movementTypeDistribution} />
                </div>
            </div>

            <BarChart data={invoicesPerMonth} title="Notas Fiscais por Mês" />

        </div>
    );
};

export default DashboardPage;