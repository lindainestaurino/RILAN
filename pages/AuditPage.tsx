
import React, { useState, useEffect } from 'react';
import { apiGetAuditLogs } from '../services/api';
import { AuditLog } from '../types';

const AuditPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await apiGetAuditLogs();
                setLogs(data);
            } catch (error) {
                console.error("Failed to fetch audit logs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="text-center p-8">Carregando logs de auditoria...</div>
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Auditoria</h1>
            <p className="text-slate-400">Registro de todas as ações importantes realizadas no sistema.</p>

            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">Data/Hora</th>
                                <th scope="col" className="px-6 py-3">Usuário</th>
                                <th scope="col" className="px-6 py-3">Ação</th>
                                <th scope="col" className="px-6 py-3">Entidade</th>
                                <th scope="col" className="px-6 py-3">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-600">
                                    <td className="px-6 py-4">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                                    <td className="px-6 py-4 font-medium">{log.user}</td>
                                    <td className="px-6 py-4">{log.action}</td>
                                    <td className="px-6 py-4">{log.entity} #{log.entityId}</td>
                                    <td className="px-6 py-4 text-xs">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditPage;
