import React, { useState, useEffect, useMemo } from 'react';
import { apiGetMaterials, apiUpdateMaterial, apiGetSuppliers, apiAddMaterial } from '../services/api';
import { Material, Role, Supplier } from '../types';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colorClasses = {
        'ESTOQUE BOM': 'bg-green-500/20 text-green-300',
        'ESTOQUE RAZOÁVEL': 'bg-yellow-500/20 text-yellow-300',
        'ESTOQUE BAIXO!': 'bg-red-500/20 text-red-300',
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClasses[status] || 'bg-slate-500/20 text-slate-300'}`}>
            {status}
        </span>
    );
};

const RecommendationBadge: React.FC<{ recommendation: string }> = ({ recommendation }) => {
    const colorClasses = {
        'NÃO': 'bg-slate-600 text-slate-300',
        'TALVEZ': 'bg-yellow-500/20 text-yellow-300',
        'COMPRA IMEDIATA': 'bg-red-500/20 text-red-300 font-bold',
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClasses[recommendation] || 'bg-slate-500/20 text-slate-300'}`}>
            {recommendation}
        </span>
    );
};


interface MaterialFormProps {
    onSave: (data: any) => void;
    onCancel: () => void;
    isSaving: boolean;
    suppliers: Supplier[];
    material?: Material;
}

const MaterialForm: React.FC<MaterialFormProps> = ({ onSave, onCancel, isSaving, suppliers, material }) => {
    const [formData, setFormData] = useState({
        description: material?.description || '',
        minStock: material?.minStock || 50,
        category: material?.category || '',
        unit: material?.unit || 'UN',
        avgCost: material?.avgCost || 0,
        supplierId: material?.supplier.id || suppliers[0]?.id || '',
        initialStock: 0
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = material ? { description: formData.description, minStock: formData.minStock } : { ...formData, avgCost: Number(formData.avgCost), minStock: Number(formData.minStock), initialStock: Number(formData.initialStock) };
        onSave(dataToSave);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
                <input
                    id="description"
                    name="description"
                    type="text"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-teal-500 focus:border-teal-500"
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="minStock" className="block text-sm font-medium text-slate-300 mb-1">Estoque Mínimo</label>
                    <input
                        id="minStock"
                        name="minStock"
                        type="number"
                        value={formData.minStock}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-teal-500 focus:border-teal-500"
                        required
                        min="0"
                    />
                </div>
                 {!material && (
                    <div>
                        <label htmlFor="initialStock" className="block text-sm font-medium text-slate-300 mb-1">Estoque Inicial</label>
                        <input
                            id="initialStock"
                            name="initialStock"
                            type="number"
                            value={formData.initialStock}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-teal-500 focus:border-teal-500"
                            required
                            min="0"
                        />
                    </div>
                )}
            </div>

            {!material && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="unit" className="block text-sm font-medium text-slate-300 mb-1">Unidade</label>
                        <select id="unit" name="unit" value={formData.unit} onChange={handleChange} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-teal-500 focus:border-teal-500">
                           <option>UN</option>
                           <option>M</option>
                           <option>M²</option>
                           <option>M³</option>
                           <option>KG</option>
                           <option>L</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="avgCost" className="block text-sm font-medium text-slate-300 mb-1">Custo Médio (R$)</label>
                        <input
                            id="avgCost"
                            name="avgCost"
                            type="number"
                            step="0.01"
                            value={formData.avgCost}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-teal-500 focus:border-teal-500"
                            required
                            min="0"
                        />
                    </div>
                 </div>
            )}
            
            {!material && (
                 <div>
                    <label htmlFor="supplierId" className="block text-sm font-medium text-slate-300 mb-1">Fornecedor</label>
                    <select id="supplierId" name="supplierId" value={formData.supplierId} onChange={handleChange} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-teal-500 focus:border-teal-500" required>
                       {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            )}


            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition disabled:bg-slate-500 disabled:cursor-not-allowed">
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </form>
    );
};


const MaterialsPage: React.FC = () => {
    const { user } = useAuth();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [materialsData, suppliersData] = await Promise.all([
                    apiGetMaterials(),
                    apiGetSuppliers()
                ]);
                materialsData.sort((a, b) => a.description.localeCompare(b.description));
                setMaterials(materialsData);
                setSuppliers(suppliersData);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredMaterials = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        return materials.filter(m => 
            m.code.toLowerCase().includes(lowercasedFilter) ||
            m.description.toLowerCase().includes(lowercasedFilter) ||
            m.supplier.name.toLowerCase().includes(lowercasedFilter)
        );
    }, [materials, searchTerm]);
    
    const handleEditClick = (material: Material) => {
        setSelectedMaterial(material);
        setIsEditModalOpen(true);
    };
    
    const handleAddClick = () => {
        setIsAddModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setIsAddModalOpen(false);
        setSelectedMaterial(null);
    };

    const handleSaveMaterial = async (updatedData: Partial<Pick<Material, 'description' | 'minStock'>>) => {
        if (!selectedMaterial) return;
        setIsSaving(true);
        try {
            const updatedMaterial = await apiUpdateMaterial(selectedMaterial.id, updatedData);
            setMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
            handleCloseModal();
        } catch (error) {
            console.error("Failed to update material", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    // Fix: Corrected the type for the new material data to align with the API definition.
    const handleSaveNewMaterial = async (data: Omit<Material, 'id' | 'code' | 'controlStatus' | 'purchaseRecommendation' | 'stockValue' | 'currentStock' | 'supplier'> & { supplierId: string, initialStock: number }) => {
        setIsSaving(true);
        try {
            const newMaterial = await apiAddMaterial(data);
            setMaterials(prev => [...prev, newMaterial].sort((a, b) => a.description.localeCompare(b.description)));
            handleCloseModal();
        } catch (error) {
            console.error("Failed to add material", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center p-8">Carregando materiais...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Materiais</h1>
                {user?.role === Role.Gerente && (
                    <button onClick={handleAddClick} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition">
                        Adicionar Material
                    </button>
                )}
            </div>

            <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
                <input
                    type="text"
                    placeholder="Pesquisar por código, descrição ou fornecedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-teal-500 focus:border-teal-500"
                />
            </div>

            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">Código</th>
                                <th scope="col" className="px-6 py-3">Descrição</th>
                                <th scope="col" className="px-6 py-3">Fornecedor</th>
                                <th scope="col" className="px-6 py-3">Estoque</th>
                                <th scope="col" className="px-6 py-3">Mínimo</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Recomendação</th>
                                <th scope="col" className="px-6 py-3">Valor Estoque</th>
                                {user?.role === Role.Gerente && <th scope="col" className="px-6 py-3">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMaterials.map(item => (
                                <tr key={item.id} className={`bg-slate-800 border-b border-slate-700 hover:bg-slate-600 ${item.currentStock < item.minStock ? 'bg-red-900/30' : ''}`}>
                                    <td className="px-6 py-4 font-medium">{item.code}</td>
                                    <td className="px-6 py-4">{item.description}</td>
                                    <td className="px-6 py-4">{item.supplier.name}</td>
                                    <td className={`px-6 py-4 font-bold ${item.currentStock < item.minStock ? 'text-red-400' : 'text-green-400'}`}>{item.currentStock}</td>
                                    <td className="px-6 py-4">{item.minStock}</td>
                                    <td className="px-6 py-4"><StatusBadge status={item.controlStatus} /></td>
                                    <td className="px-6 py-4"><RecommendationBadge recommendation={item.purchaseRecommendation} /></td>
                                    <td className="px-6 py-4">{item.stockValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    {user?.role === Role.Gerente && (
                                        <td className="px-6 py-4 space-x-2">
                                            <button onClick={() => handleEditClick(item)} className="text-sky-400 hover:text-sky-300 font-medium">Editar</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isEditModalOpen && selectedMaterial && (
                <Modal title={`Editar Material: ${selectedMaterial.code}`} isOpen={isEditModalOpen} onClose={handleCloseModal}>
                    <MaterialForm 
                        material={selectedMaterial} 
                        onSave={handleSaveMaterial} 
                        onCancel={handleCloseModal} 
                        isSaving={isSaving}
                        suppliers={suppliers}
                    />
                </Modal>
            )}
             {isAddModalOpen && (
                <Modal title="Adicionar Novo Material" isOpen={isAddModalOpen} onClose={handleCloseModal}>
                    <MaterialForm 
                        onSave={handleSaveNewMaterial} 
                        onCancel={handleCloseModal} 
                        isSaving={isSaving}
                        suppliers={suppliers}
                    />
                </Modal>
            )}
        </div>
    );
};

export default MaterialsPage;