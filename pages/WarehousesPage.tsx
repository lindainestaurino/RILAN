import React, { useState, useEffect, useMemo } from 'react';
import { apiGetStockMovements } from '../services/api';
import { StockMovement, MovementType } from '../types';
import { BuildingStorefrontIcon, ArrowUpIcon, ArrowDownIcon } from '../components/icons/Icons';

interface Location {
    lat: number;
    lon: number;
}

interface Warehouse {
    id: number;
    name: string;
    address: string;
    location: Location;
}

const WAREHOUSES: Warehouse[] = [
    { id: 1, name: 'Galpão Principal - Serra', address: 'Av. Eldes Scherrer Souza, 2162 - Colina de Laranjeiras, Serra - ES', location: { lat: -20.1913, lon: -40.2486 } },
    { id: 2, name: 'Centro de Distribuição - Vitória', address: 'Av. Fernando Ferrari, 1080 - Mata da Praia, Vitória - ES', location: { lat: -20.2771, lon: -40.3015 } },
    { id: 3, name: 'Ponto de Apoio - Vila Velha', address: 'Rod. do Sol, 5000 - Jockey de Itaparica, Vila Velha - ES', location: { lat: -20.3858, lon: -40.3233 } },
];

const getDistance = (loc1: Location, loc2: Location) => {
    const dx = loc1.lat - loc2.lat;
    const dy = loc1.lon - loc2.lon;
    return Math.sqrt(dx * dx + dy * dy);
};

const WarehousesMap: React.FC<{ warehouses: Warehouse[] }> = ({ warehouses }) => {
    if (warehouses.length === 0) {
        return <p className="text-center text-slate-400 py-4">Nenhum galpão definido.</p>;
    }
    
    const lats = warehouses.map(w => w.location.lat);
    const lons = warehouses.map(w => w.location.lon);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    
    const latPadding = (maxLat - minLat) * 0.2 || 0.05;
    const lonPadding = (maxLon - minLon) * 0.2 || 0.05;

    const bbox = [
        minLon - lonPadding,
        minLat - latPadding,
        maxLon + lonPadding,
        maxLat + latPadding
    ].join(',');
    
    const markers = warehouses.map(w => `marker=${w.location.lat},${w.location.lon}`).join('&');

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
                title="Mapa de Galpões"
                aria-label="Mapa mostrando a localização dos galpões"
            ></iframe>
        </div>
    );
};


const WarehousesPage: React.FC = () => {
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovements = async () => {
            try {
                const movementsData = await apiGetStockMovements();
                setMovements(movementsData);
            } catch (error) {
                console.error("Failed to fetch movements", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMovements();
    }, []);

    const warehouseStats = useMemo(() => {
        const stats = new Map<number, { warehouse: Warehouse; movements: StockMovement[] }>();

        WAREHOUSES.forEach(w => {
            stats.set(w.id, { warehouse: w, movements: [] });
        });

        movements.forEach(mov => {
            if (mov.location) {
                let closestWarehouse: Warehouse | null = null;
                let minDistance = Infinity;

                WAREHOUSES.forEach(w => {
                    const distance = getDistance(mov.location!, w.location);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestWarehouse = w;
                    }
                });

                if (closestWarehouse) {
                    stats.get(closestWarehouse.id)?.movements.push(mov);
                }
            }
        });
        return Array.from(stats.values());

    }, [movements]);

    if (loading) {
        return <div className="text-center p-8">Analisando dados de localização...</div>
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Nossos Galpões</h1>
            <p className="text-slate-400">Visualize a localização dos centros de distribuição e a atividade de cada um.</p>

            <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-4">Mapa de Localização</h2>
                <WarehousesMap warehouses={WAREHOUSES} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {warehouseStats.map(({ warehouse, movements }) => {
                    const totalIn = movements.filter(m => m.type === MovementType.Entrada).length;
                    const totalOut = movements.filter(m => m.type === MovementType.Saida).length;

                    return (
                         <div key={warehouse.id} className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 flex flex-col">
                            <div className="flex items-center mb-4">
                                <BuildingStorefrontIcon className="h-8 w-8 text-teal-400 mr-4"/>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{warehouse.name}</h3>
                                    <p className="text-xs text-slate-400">{warehouse.address}</p>
                                </div>
                            </div>
                            <div className="mt-auto pt-4 border-t border-slate-700 flex justify-around">
                                <div className="text-center">
                                    <p className="text-sm font-medium text-slate-400">Total de Mov.</p>
                                    <p className="text-2xl font-bold mt-1 text-white">{movements.length}</p>
                                </div>
                                <div className="text-center">
                                    {/* Fix: Use ArrowUpIcon to represent incoming movements. */}
                                    <p className="text-sm font-medium text-slate-400 flex items-center justify-center">
                                        <ArrowUpIcon className="h-4 w-4 mr-1 text-green-400" />
                                        Entradas
                                    </p>
                                    <p className="text-2xl font-bold mt-1 text-green-400">{totalIn}</p>
                                </div>
                                <div className="text-center">
                                    {/* Fix: Use ArrowDownIcon to represent outgoing movements. */}
                                    <p className="text-sm font-medium text-slate-400 flex items-center justify-center">
                                        <ArrowDownIcon className="h-4 w-4 mr-1 text-red-400" />
                                        Saídas
                                    </p>
                                    <p className="text-2xl font-bold mt-1 text-red-400">{totalOut}</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

        </div>
    );
};

export default WarehousesPage;