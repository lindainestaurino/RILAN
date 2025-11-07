import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { BarChartIcon, BoxIcon, ClipboardListIcon, HomeIcon, RilanLogoIcon, UsersIcon, WarehouseIcon, ChatBubbleBottomCenterTextIcon } from '../icons/Icons';

const Sidebar: React.FC = () => {
    const { user } = useAuth();

    const commonLinks = [
        { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
        { to: '/materials', icon: WarehouseIcon, label: 'Materiais' },
        { to: '/movements', icon: BoxIcon, label: 'Movimentações' },
        { to: '/ai-chat', icon: ChatBubbleBottomCenterTextIcon, label: 'Chat IA' },
    ];

    const managerLinks = [
        { to: '/reports', icon: BarChartIcon, label: 'Relatórios' },
        { to: '/users', icon: UsersIcon, label: 'Usuários' },
        { to: '/audit', icon: ClipboardListIcon, label: 'Auditoria' },
    ];
    
    const links = user?.role === Role.Gerente ? [...commonLinks, ...managerLinks] : commonLinks;
    
    const linkClass = "flex items-center px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors duration-200";
    const activeLinkClass = "flex items-center px-4 py-3 bg-teal-600 text-white rounded-lg font-semibold shadow-lg";

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 hidden md:block">
            <div className="flex items-center justify-center h-16 border-b border-slate-800 px-4">
                <RilanLogoIcon className="h-10 w-auto" />
            </div>
            <nav className="mt-6 px-4 space-y-2">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => isActive ? activeLinkClass : linkClass}
                    >
                        <link.icon className="h-5 w-5 mr-3" />
                        {link.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;