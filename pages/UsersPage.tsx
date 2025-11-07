import React, { useState, useEffect } from 'react';
import { apiGetUsers, apiUpdateUser, apiToggleUserStatus } from '../services/api';
import { User, Role } from '../types';
import Modal from '../components/Modal';

interface EditUserFormProps {
    user: User;
    onSave: (data: Partial<Pick<User, 'name' | 'email' | 'role'>>) => void;
    onCancel: () => void;
    isSaving: boolean;
}

const EditUserForm: React.FC<EditUserFormProps> = ({ user, onSave, onCancel, isSaving }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [role, setRole] = useState(user.role);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, email, role });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Nome</label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-teal-500 focus:border-teal-500"
                    required
                />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-teal-500 focus:border-teal-500"
                    required
                />
            </div>
            <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-1">Perfil</label>
                <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-teal-500 focus:border-teal-500"
                >
                    <option value={Role.Operador}>Operador</option>
                    <option value={Role.Gerente}>Gerente</option>
                </select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition disabled:bg-slate-500 disabled:cursor-not-allowed">
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </form>
    );
};

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await apiGetUsers();
                setUsers(data);
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    
    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const handleSaveUser = async (updatedData: Partial<Pick<User, 'name' | 'email' | 'role'>>) => {
        if (!selectedUser) return;
        setIsSaving(true);
        try {
            const updatedUser = await apiUpdateUser(selectedUser.id, updatedData);
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            handleCloseModal();
        } catch (error) {
            console.error("Failed to update user", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async (userToToggle: User) => {
        if (!window.confirm(`Tem certeza que deseja ${userToToggle.active ? 'desativar' : 'ativar'} o usuário ${userToToggle.name}?`)) {
            return;
        }
        try {
            const updatedUser = await apiToggleUserStatus(userToToggle.id);
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        } catch (error) {
            console.error("Failed to toggle user status", error);
            alert(error instanceof Error ? error.message : 'Ocorreu um erro.');
        }
    };

    if (loading) {
        return <div className="text-center p-8">Carregando usuários...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Gerenciamento de Usuários</h1>
                <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition">
                    Adicionar Usuário
                </button>
            </div>

            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nome</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3">Perfil</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Criado em</th>
                                <th scope="col" className="px-6 py-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-600">
                                    <td className="px-6 py-4 font-medium">{user.name}</td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4 capitalize">{user.role}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                            {user.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4 space-x-2">
                                        <button onClick={() => handleEditClick(user)} className="text-sky-400 hover:text-sky-300 font-medium">Editar</button>
                                        <button onClick={() => handleToggleStatus(user)} className="text-red-400 hover:text-red-300 font-medium">
                                            {user.active ? 'Desativar' : 'Ativar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && selectedUser && (
                <Modal title={`Editar Usuário: ${selectedUser.name}`} isOpen={isModalOpen} onClose={handleCloseModal}>
                    <EditUserForm 
                        user={selectedUser} 
                        onSave={handleSaveUser} 
                        onCancel={handleCloseModal}
                        isSaving={isSaving}
                    />
                </Modal>
            )}
        </div>
    );
};

export default UsersPage;