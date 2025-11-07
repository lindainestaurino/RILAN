import React, { useState, useEffect, useMemo } from 'react';
import { apiGetStockMovements, apiGetMaterials, apiAddMovement, apiGetSuppliers, apiReverseMovement } from '../services/api';
import { StockMovement, Role, MovementType, MovementReason, Material, Supplier } from '../types';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const MovementsMap: React.FC<{ movements: StockMovement[] }> = ({ movements }) => {
    const locations = useMemo(() => {
        // Usando um Map para obter localizações únicas e evitar sobrecarga no mapa
        const uniqueLocations = new Map<string, { lat: number; lon: number }>();
        movements.forEach(m => {
            if (m.location) {
                // Arredonda para ~10m de precisão para agrupar pins muito próximos
                const key = `${m.location.lat.toFixed(4)},${m.location.lon.toFixed(4)}`;
                if (!uniqueLocations.has(key)) {
                    uniqueLocations.set(key, m.location);
                }
            }
        });
        return Array.from(uniqueLocations.values());
    }, [movements]);

    if (locations.length === 0) {
        return <p className="text-center text-slate-400 py-4">Nenhuma localização de GPS encontrada nas movimentações.</p>;
    }
    
    const lats = locations.map(l => l.lat);
    const lons = locations.map(l => l.lon);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    
    // Adiciona um preenchimento à caixa delimitadora para melhor visualização
    const latPadding = (maxLat - minLat) * 0.1 || 0.01;
    const lonPadding = (maxLon - minLon) * 0.1 || 0.01;

    const bbox = [
        minLon - lonPadding,
        minLat - latPadding,
        maxLon + lonPadding,
        maxLat + latPadding
    ].join(',');
    
    const markers = locations.map(loc => `marker=${loc.lat},${loc.lon}`).join('&');

    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&${markers}`;

    return (
        <div className="bg-slate-700/50 rounded-lg p-2 aspect-video overflow-hidden">
             <iframe
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={mapUrl}
                className="rounded-md border-0"
                title="Mapa de Movimentações"
                aria-label="Mapa mostrando a localização das movimentações de estoque"
            ></iframe>
        </div>
    );
};

interface AddMovementFormProps {
    materials: Material[];
    suppliers: Supplier[];
    onSave: (data: any) => void;
    onCancel: () => void;
    isSaving: boolean;
}

const AddMovementForm: React.FC<AddMovementFormProps> = ({ materials, suppliers, onSave, onCancel, isSaving }) => {
    const [type, setType] = useState<MovementType>(MovementType.Entrada);
    const [reason, setReason] = useState<MovementReason>(MovementReason.Compra);
    const [materialId, setMaterialId] = useState<number | ''>(materials[0]?.id || '');
    const [supplierId, setSupplierId] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [docRef, setDocRef] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');

    const reasonOptions = {
        [MovementType.Entrada]: [MovementReason.Compra, MovementReason.AjustePositivo, MovementReason.Devolucao, MovementReason.Estorno],
        [MovementType.Saida]: [MovementReason.Venda, MovementReason.AjusteNegativo, MovementReason.ConsumoInterno],
    };

    useEffect(() => {
        setReason(reasonOptions[type][0]);
    }, [type]);

    useEffect(() => {
        // When material changes, update default supplier
        if (materialId) {
            const material = materials.find(m => m.id === materialId);
            if(material) {
                setSupplierId(material.supplier.id);
            }
        } else {
            setSupplierId('');
        }
    }, [materialId, materials]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!materialId) {
            setError('Por favor, selecione um material.');
            return;
        }

        const saveData = (location?: { lat: number, lon: number }) => {
            const dataToSave = {
                materialId,
                type,
                reason,
                quantity,
                docRef,
                note,
                location,
                supplierId: type === MovementType.Entrada && reason === MovementReason.Compra ? supplierId : undefined
            };
            onSave(dataToSave);
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                saveData({ lat: latitude, lon: longitude });
            },
            (geoError) => {
                console.warn("Could not get location, proceeding without it.", geoError);
                saveData(undefined);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             {error && <p className="text-sm text-red-500 text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Movimentação</label>
                <div className="flex space-x-4">
                    <label className="flex items-center">
                        <input type="radio" name="type" value={MovementType.Entrada} checked={type === MovementType.Entrada} onChange={() => setType(MovementType.Entrada)} className="form-radio h-4 w-4 text-teal-600 bg-slate-700 border-slate-600 focus:ring-teal-500" />
                        <span className="ml-2 text-white">Entrada</span>
                    </label>
                    <label className="flex items-center">
                        <input type="radio" name="type" value={MovementType.Saida} checked={type === MovementType.Saida} onChange={() => setType(MovementType.Saida)} className="form-radio h-4 w-4 text-red-600 bg-slate-700 border-slate-600 focus:ring-red-500" />
                        <span className="ml-2 text-white">Saída</span>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="materialId" className="block text-sm font-medium text-slate-300 mb-1">Material</label>
                    <select id="materialId" value={materialId} onChange={(e) => setMaterialId(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-teal-500 focus:border-teal-500" required>
                       <option value="" disabled>Selecione...</option>
                       {materials.map(m => <option key={m.id} value={m.id}>{m.code} - {m.description}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-slate-300 mb-1">Quantidade</label>
                    <input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-teal-500 focus:border-teal-500" required min="1" />
                </div>
            </div>

            {type === MovementType.Entrada && reason === MovementReason.Compra && (
                <div>
                    <label htmlFor="supplierId" className="block text-sm font-medium text-slate-300 mb-1">Fornecedor</label>
                    <select id="supplierId" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-teal-500 focus:border-teal-500" required>
                       <option value="" disabled>Selecione...</option>
                       {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-slate-300 mb-1">Motivo</label>
                    <select id="reason" value={reason} onChange={(e) => setReason(e.target.value as MovementReason)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-teal-500 focus:border-teal-500 capitalize">
                       {reasonOptions[type].map(r => <option key={r} value={r}>{r.replace('+', ' (+)') .replace('-', ' (-)')}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="docRef" className="block text-sm font-medium text-slate-300 mb-1">Documento (NF, etc.)</label>
                    <input id="docRef" type="text" value={docRef} onChange={(e) => setDocRef(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-teal-500 focus:border-teal-500" />
                </div>
            </div>
            
             <div>
                <label htmlFor="note" className="block text-sm font-medium text-slate-300 mb-1">Observação</label>
                <input id="note" type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-teal-500 focus:border-teal-500" placeholder="Opcional..."/>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition disabled:bg-slate-500 disabled:cursor-not-allowed">
                    {isSaving ? 'Salvando...' : 'Registrar Movimentação'}
                </button>
            </div>
        </form>
    );
};


const MovementsPage: React.FC = () => {
    const { user } = useAuth();
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [movementsData, materialsData, suppliersData] = await Promise.all([
                apiGetStockMovements(),
                apiGetMaterials(),
                apiGetSuppliers(),
            ]);
            setMovements(movementsData);
            materialsData.sort((a,b) => a.description.localeCompare(b.description));
            setMaterials(materialsData);
            setSuppliers(suppliersData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    const reversedMovements = useMemo(() => 
        new Set(movements
            .filter(m => m.reason === MovementReason.Estorno && m.docRef?.startsWith('ESTORNO_ID_'))
            .map(m => Number(m.docRef!.split('_')[2]))
        ), [movements]);

    const handleCloseModal = () => setIsModalOpen(false);

    const handleSaveMovement = async (data: any) => {
        setIsSaving(true);
        try {
            await apiAddMovement(data, user!);
            handleCloseModal();
            fetchData(); // Refetch data to show new movement and updated stock
        } catch (error) {
            console.error("Failed to save movement", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReverseMovement = async (movement: StockMovement) => {
        if (!user) return;
        if (!window.confirm(`Tem certeza que deseja estornar a saída de ${movement.quantity} unidade(s) de "${movement.materialDescription}"? Esta ação não pode ser desfeita.`)) {
            return;
        }
        try {
            await apiReverseMovement(movement.id, user);
            fetchData(); // Refetch to show changes
        } catch (error) {
            console.error("Failed to reverse movement", error);
            alert(error instanceof Error ? error.message : 'Ocorreu um erro ao estornar.');
        }
    };

    if (loading) {
        return <div className="text-center p-8">Carregando movimentações...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Movimentações de Estoque</h1>
                <button onClick={() => setIsModalOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition">
                    Nova Movimentação
                </button>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-4">Localização das Movimentações</h2>
                <MovementsMap movements={movements} />
            </div>

            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">Data</th>
                                <th scope="col" className="px-6 py-3">Material (Cód)</th>
                                <th scope="col" className="px-6 py-3">Descrição</th>
                                <th scope="col" className="px-6 py-3">Fornecedor</th>
                                <th scope="col" className="px-6 py-3">Tipo</th>
                                <th scope="col" className="px-6 py-3">Motivo</th>
                                <th scope="col" className="px-6 py-3">Qtd</th>
                                <th scope="col" className="px-6 py-3">Usuário</th>
                                {user?.role === Role.Gerente && <th scope="col" className="px-6 py-3">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {movements.map(mov => {
                                const isReversed = reversedMovements.has(mov.id);
                                return (
                                <tr key={mov.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-600">
                                    <td className="px-6 py-4">{new Date(mov.movedAt).toLocaleString('pt-BR')}</td>
                                    <td className="px-6 py-4 font-medium">{mov.materialCode}</td>
                                    <td className="px-6 py-4">{mov.materialDescription}</td>
                                    <td className="px-6 py-4 text-xs">{mov.supplierName || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${mov.type === 'entrada' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                            {mov.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 capitalize">{mov.reason.replace('+', ' (+)') .replace('-', ' (-)')}</td>
                                    <td className={`px-6 py-4 font-bold ${mov.type === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                                        {mov.type === 'entrada' ? '+' : '-'}{mov.quantity}
                                    </td>
                                    <td className="px-6 py-4">{mov.createdBy}</td>
                                    {user?.role === Role.Gerente && (
                                        <td className="px-6 py-4">
                                            {mov.reason !== MovementReason.Estorno && mov.type === MovementType.Saida && (
                                                 isReversed ? (
                                                    <span className="text-yellow-500 text-xs font-semibold">Estornado</span>
                                                 ) : (
                                                    <button onClick={() => handleReverseMovement(mov)} className="text-yellow-400 hover:text-yellow-300 font-medium">Estornar</button>
                                                 )
                                            )}
                                        </td>
                                    )}
                                </tr>
                                )}
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && (
                <Modal title="Registrar Nova Movimentação" isOpen={isModalOpen} onClose={handleCloseModal}>
                    <AddMovementForm
                        materials={materials}
                        suppliers={suppliers}
                        onSave={handleSaveMovement}
                        onCancel={handleCloseModal}
                        isSaving={isSaving}
                    />
                </Modal>
            )}
        </div>
    );
};

export default MovementsPage;