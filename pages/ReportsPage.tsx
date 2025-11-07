
import React, { useState, useEffect } from 'react';
import { apiGetMaterials, apiGetStockMovements, apiGetSalesForecast } from '../services/api';
import { Material, StockMovement, SalesForecast } from '../types';
import { exportStockBalance, exportLowStockItems, exportMovementsByPeriod, exportKardex, exportSalesForecast } from '../services/pdfExporter';
import Modal from '../components/Modal';
import { LightBulbIcon } from '../components/icons/Icons';


interface ReportCardProps {
    title: string;
    description: string;
    onPdfExport?: () => void;
    onView?: () => void;
    exporting: boolean;
    isViewable?: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, description, onPdfExport, onView, exporting, isViewable }) => (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 flex flex-col justify-between">
        <div>
            <h3 className="text-lg font-bold text-white flex items-center">
                {title.includes("IA") && <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-300" />}
                {title}
            </h3>
            <p className="text-slate-400 mt-2 text-sm">{description}</p>
        </div>
        <div className="mt-4 flex space-x-2">
            {isViewable && (
                 <button 
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition disabled:bg-teal-800/50 disabled:cursor-not-allowed"
                    onClick={onView}
                    disabled={exporting}
                >
                    {exporting ? 'Analisando...' : 'Visualizar'}
                </button>
            )}
            {onPdfExport && (
                 <button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition disabled:bg-indigo-800/50 disabled:cursor-not-allowed"
                    onClick={onPdfExport}
                    disabled={exporting}
                >
                    {exporting ? 'Carregando...' : 'Exportar PDF'}
                </button>
            )}
        </div>
    </div>
);


const ReportsPage: React.FC = () => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [forecast, setForecast] = useState<SalesForecast[]>([]);
    const [loading, setLoading] = useState(true);
    const [forecastLoading, setForecastLoading] = useState(true);
    const [isKardexModalOpen, setIsKardexModalOpen] = useState(false);
    const [isForecastModalOpen, setIsForecastModalOpen] = useState(false);
    const [selectedKardexMaterialId, setSelectedKardexMaterialId] = useState<string>('');
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setForecastLoading(true);
                const [materialsData, movementsData] = await Promise.all([
                    apiGetMaterials(),
                    apiGetStockMovements(),
                ]);
                materialsData.sort((a,b) => a.description.localeCompare(b.description));
                setMaterials(materialsData);
                setMovements(movementsData);
                if (materialsData.length > 0) {
                    setSelectedKardexMaterialId(String(materialsData[0].id));
                }

                const forecastData = await apiGetSalesForecast(movementsData);
                setForecast(forecastData);

            } catch (error) {
                console.error("Failed to fetch report data", error);
            } finally {
                setLoading(false);
                setForecastLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleExportKardex = () => {
        const material = materials.find(m => m.id === Number(selectedKardexMaterialId));
        if (material) {
            exportKardex(material, movements);
            setIsKardexModalOpen(false);
        } else {
            alert("Material selecionado não encontrado.");
        }
    };

    const reports = [
        {
            title: "Saldo Atual de Estoque",
            description: "Lista completa de todos os materiais com seus saldos atuais, custo médio e valor total.",
            onPdfExport: () => exportStockBalance(materials)
        },
        {
            title: "Itens Abaixo do Mínimo",
            description: "Relatório focado nos itens que estão com o saldo atual abaixo do estoque mínimo definido.",
            onPdfExport: () => exportLowStockItems(materials)
        },
        {
            title: "Extrato por Material (Kardex)",
            description: "Histórico completo de movimentações para um material específico.",
            onPdfExport: () => setIsKardexModalOpen(true)
        },
        {
            title: "Movimentações por Período",
            description: "Todas as movimentações de entrada e saída realizadas em um período de tempo selecionado.",
            onPdfExport: () => exportMovementsByPeriod(movements)
        },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Relatórios</h1>
            <p className="text-slate-400">Exporte relatórios detalhados do sistema ou utilize a IA para análises preditivas.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReportCard
                    title="Previsão de Vendas (IA)"
                    description="A IA analisa o histórico de saídas para prever os 5 produtos mais vendidos no próximo mês."
                    onView={() => setIsForecastModalOpen(true)}
                    onPdfExport={() => exportSalesForecast(forecast)}
                    exporting={forecastLoading}
                    isViewable
                />
                {reports.map(report => (
                    <ReportCard 
                        key={report.title}
                        title={report.title}
                        description={report.description}
                        onPdfExport={report.onPdfExport}
                        exporting={loading}
                    />
                ))}
            </div>

            {isKardexModalOpen && (
                <Modal title="Selecionar Material para Kardex" isOpen={isKardexModalOpen} onClose={() => setIsKardexModalOpen(false)}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="material-select" className="block text-sm font-medium text-slate-300 mb-1">
                                Escolha o Material
                            </label>
                            <select 
                                id="material-select"
                                value={selectedKardexMaterialId}
                                onChange={(e) => setSelectedKardexMaterialId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-teal-500 focus:border-teal-500"
                            >
                                {materials.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.code} - {m.description}
                                    </option>
                                ))}
                            </select>
                        </div>
                         <div className="flex justify-end space-x-3 pt-4">
                            <button type="button" onClick={() => setIsKardexModalOpen(false)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition">Cancelar</button>
                            <button type="button" onClick={handleExportKardex} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition">
                                Exportar PDF
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {isForecastModalOpen && (
                <Modal title="Previsão de Vendas" isOpen={isForecastModalOpen} onClose={() => setIsForecastModalOpen(false)}>
                   <div className="space-y-4">
                        <p className="text-sm text-slate-400">Com base no histórico, estes são os 5 produtos com maior probabilidade de venda no próximo mês.</p>
                        <ul className="space-y-3">
                            {forecast.map(item => (
                                <li key={item.predictedRank} className="p-4 bg-slate-700/50 rounded-lg border-l-4 border-teal-500">
                                    <p className="font-bold text-white">#{item.predictedRank}: {item.materialDescription}</p>
                                    <p className="text-sm text-slate-300 mt-1"><span className="font-semibold">Justificativa da IA:</span> {item.justification}</p>
                                </li>
                            ))}
                        </ul>
                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={() => setIsForecastModalOpen(false)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition">Fechar</button>
                        </div>
                   </div>
                </Modal>
            )}
        </div>
    );
};

export default ReportsPage;
