import React, { useState, useEffect } from 'react';
import {
    Activity,
    RefreshCw,
    Filter,
    Search,
    Download,
    Calendar,
    MapPin,
    User,
    Package,
    ArrowUp,
    ArrowDown,
    ArrowRightLeft,
    Settings,
    Eye,
    FileText,
    TrendingUp,
    TrendingDown,
    Plus,
    Minus,
    RotateCcw,
    Truck,
    ChevronLeft,
    ChevronRight,
    Clock
} from 'lucide-react';
import { getStockMovements, getWarehouses } from '../services/api';

const StockMovementsView = ({ theme }) => {
    const [movements, setMovements] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // États pour les filtres et pagination
    const [filters, setFilters] = useState({
        search: '',
        warehouse_id: '',
        product_id: '',
        movement_type: '',
        date_from: '',
        date_to: '',
        user_id: '',
        sort_by: 'created_at',
        sort_order: 'desc'
    });
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalMovements, setTotalMovements] = useState(0);

    // États pour les modals
    const [selectedMovement, setSelectedMovement] = useState(null);
    const [showMovementDetails, setShowMovementDetails] = useState(false);

    // Classes CSS pour thème
    const isDark = theme === 'dark';
    const bgClass = isDark ? 'bg-gray-900' : 'bg-gray-100';
    const textClass = isDark ? 'text-gray-200' : 'text-gray-800';
    const cardBgClass = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const hoverBgClass = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
    const inputBgClass = isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';

    // Fonction pour charger les données
    const loadData = async () => {
        try {
            setError(null);

            const apiFilters = {
                ...filters,
                page: currentPage,
                per_page: 20
            };

            const [movementsResponse, warehousesResponse] = await Promise.all([
                getStockMovements(apiFilters),
                getWarehouses()
            ]);

            if (movementsResponse?.success) {
                const data = movementsResponse.data;
                setMovements(Array.isArray(data) ? data : data?.data || []);
                setTotalPages(data?.last_page || 1);
                setTotalMovements(data?.total || 0);
            } else {
                setMovements([]);
                setTotalPages(1);
                setTotalMovements(0);
            }

            if (warehousesResponse?.success) {
                setWarehouses(Array.isArray(warehousesResponse.data) ? warehousesResponse.data : warehousesResponse.data?.data || []);
            }

        } catch (err) {
            console.error('Erreur lors du chargement des mouvements:', err);
            setError('Erreur lors du chargement des données');
            setMovements([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fonction de rafraîchissement
    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
    };

    // Gestion des filtres
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const applyFilters = () => {
        setCurrentPage(1);
        loadData();
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            warehouse_id: '',
            product_id: '',
            movement_type: '',
            date_from: '',
            date_to: '',
            user_id: '',
            sort_by: 'created_at',
            sort_order: 'desc'
        });
        setCurrentPage(1);
    };

    // Gestion de la pagination
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Chargement initial et au changement de page
    useEffect(() => {
        loadData();
    }, [currentPage]);

    // Fonctions utilitaires
    const getMovementIcon = (type) => {
        switch (type) {
            case 'in':
            case 'stock_in':
            case 'restock':
                return <ArrowUp className="w-5 h-5 text-green-500" />;
            case 'out':
            case 'stock_out':
            case 'sale':
                return <ArrowDown className="w-5 h-5 text-red-500" />;
            case 'transfer':
                return <ArrowRightLeft className="w-5 h-5 text-blue-500" />;
            case 'adjustment':
                return <Settings className="w-5 h-5 text-orange-500" />;
            case 'order_delivery':
                return <Truck className="w-5 h-5 text-purple-500" />;
            default:
                return <Activity className="w-5 h-5 text-gray-500" />;
        }
    };

    const getMovementTypeColor = (type) => {
        switch (type) {
            case 'in':
            case 'stock_in':
            case 'restock':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'out':
            case 'stock_out':
            case 'sale':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'transfer':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'adjustment':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'order_delivery':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getMovementTypeText = (type) => {
        switch (type) {
            case 'in':
            case 'stock_in':
                return 'Entrée';
            case 'out':
            case 'stock_out':
                return 'Sortie';
            case 'transfer':
                return 'Transfert';
            case 'adjustment':
                return 'Ajustement';
            case 'restock':
                return 'Réapprovisionnement';
            case 'sale':
                return 'Vente';
            case 'order_delivery':
                return 'Livraison commande';
            default:
                return type;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatQuantity = (quantity, type) => {
        const sign = ['in', 'stock_in', 'restock'].includes(type) ? '+' :
            ['out', 'stock_out', 'sale', 'order_delivery'].includes(type) ? '-' : '';
        return `${sign}${Math.abs(quantity)}`;
    };

    // Statistiques des mouvements
    const stats = React.useMemo(() => {
        if (!movements.length) return { total: 0, entries: 0, exits: 0, transfers: 0 };

        const total = movements.length;
        const entries = movements.filter(m => ['in', 'stock_in', 'restock'].includes(m.movement_type)).length;
        const exits = movements.filter(m => ['out', 'stock_out', 'sale', 'order_delivery'].includes(m.movement_type)).length;
        const transfers = movements.filter(m => m.movement_type === 'transfer').length;

        return { total, entries, exits, transfers };
    }, [movements]);

    // Modal de détails de mouvement
    const MovementDetailsModal = () => {
        if (!showMovementDetails || !selectedMovement) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={`p-6 rounded-xl ${cardBgClass} w-full max-w-2xl max-h-[80vh] overflow-y-auto`}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Détails du mouvement</h3>
                        <button
                            onClick={() => setShowMovementDetails(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Type de mouvement</p>
                                <div className="flex items-center space-x-2">
                                    {getMovementIcon(selectedMovement.movement_type)}
                                    <span className="font-medium">{getMovementTypeText(selectedMovement.movement_type)}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Date</p>
                                <p className="font-medium">{formatDate(selectedMovement.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Produit</p>
                                <p className="font-medium">{selectedMovement.product_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Entrepôt</p>
                                <p className="font-medium">{selectedMovement.warehouse_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Quantité</p>
                                <p className="font-medium text-lg">
                                    {formatQuantity(selectedMovement.quantity, selectedMovement.movement_type)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Stock après</p>
                                <p className="font-medium">{selectedMovement.stock_after}</p>
                            </div>
                        </div>

                        {selectedMovement.reason && (
                            <div>
                                <p className="text-sm text-gray-500">Raison</p>
                                <p className="font-medium bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                    {selectedMovement.reason}
                                </p>
                            </div>
                        )}

                        {selectedMovement.reference && (
                            <div>
                                <p className="text-sm text-gray-500">Référence</p>
                                <p className="font-medium">{selectedMovement.reference}</p>
                            </div>
                        )}

                        {selectedMovement.user_name && (
                            <div>
                                <p className="text-sm text-gray-500">Effectué par</p>
                                <p className="font-medium">{selectedMovement.user_name}</p>
                            </div>
                        )}

                        {selectedMovement.movement_type === 'transfer' && selectedMovement.to_warehouse_name && (
                            <div>
                                <p className="text-sm text-gray-500">Vers l'entrepôt</p>
                                <p className="font-medium">{selectedMovement.to_warehouse_name}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={`p-8 ${bgClass} ${textClass} min-h-screen flex items-center justify-center`}>
                <div className="flex items-center space-x-2">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span className="text-lg">Chargement des mouvements...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-8 space-y-6 ${bgClass} ${textClass} min-h-screen`}>
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center">
                        <Activity className="w-8 h-8 mr-3 text-blue-500" />
                        Mouvements de Stock
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Historique complet et traçabilité des mouvements de stock
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                            showFilters ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filtres
                    </button>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Actualiser
                    </button>
                    <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            {/* Erreur */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Mouvements</p>
                            <p className="text-2xl font-bold text-blue-500">{totalMovements}</p>
                        </div>
                        <Activity className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Entrées</p>
                            <p className="text-2xl font-bold text-green-500">{stats.entries}</p>
                        </div>
                        <ArrowUp className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Sorties</p>
                            <p className="text-2xl font-bold text-red-500">{stats.exits}</p>
                        </div>
                        <ArrowDown className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Transferts</p>
                            <p className="text-2xl font-bold text-purple-500">{stats.transfers}</p>
                        </div>
                        <ArrowRightLeft className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Filtres */}
            {showFilters && (
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Recherche</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Produit, référence..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Entrepôt</label>
                            <select
                                value={filters.warehouse_id}
                                onChange={(e) => handleFilterChange('warehouse_id', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="">Tous</option>
                                {warehouses.map(warehouse => (
                                    <option key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Type</label>
                            <select
                                value={filters.movement_type}
                                onChange={(e) => handleFilterChange('movement_type', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="">Tous</option>
                                <option value="in">Entrée</option>
                                <option value="out">Sortie</option>
                                <option value="transfer">Transfert</option>
                                <option value="adjustment">Ajustement</option>
                                <option value="order_delivery">Livraison</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Date début</label>
                            <input
                                type="date"
                                value={filters.date_from}
                                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Date fin</label>
                            <input
                                type="date"
                                value={filters.date_to}
                                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            />
                        </div>

                        <div className="flex items-end space-x-2">
                            <button
                                onClick={applyFilters}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Appliquer
                            </button>
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tableau des mouvements */}
            <div className={`rounded-xl border ${cardBgClass} overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Produit
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Entrepôt
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Quantité
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Stock après
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Utilisateur
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className={`${cardBgClass} divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {movements.map((movement) => (
                            <tr key={movement.id} className={hoverBgClass}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                        {getMovementIcon(movement.movement_type)}
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getMovementTypeColor(movement.movement_type)}`}>
                                                {getMovementTypeText(movement.movement_type)}
                                            </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium">{movement.product_name || 'N/A'}</div>
                                    {movement.reference && (
                                        <div className="text-sm text-gray-500">Réf: {movement.reference}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>{movement.warehouse_name || 'N/A'}</span>
                                    </div>
                                    {movement.to_warehouse_name && (
                                        <div className="text-sm text-gray-500 flex items-center">
                                            <ArrowRightLeft className="w-3 h-3 mr-1" />
                                            {movement.to_warehouse_name}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`font-medium ${
                                            ['in', 'stock_in', 'restock'].includes(movement.movement_type) ? 'text-green-600' :
                                                ['out', 'stock_out', 'sale', 'order_delivery'].includes(movement.movement_type) ? 'text-red-600' :
                                                    'text-gray-600'
                                        }`}>
                                            {formatQuantity(movement.quantity, movement.movement_type)}
                                        </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="font-medium">{movement.stock_after || 'N/A'}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="text-sm">{formatDate(movement.created_at)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <User className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="text-sm">{movement.user_name || 'Système'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => {
                                            setSelectedMovement(movement);
                                            setShowMovementDetails(true);
                                        }}
                                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                                        title="Voir détails"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Message si pas de données */}
                {movements.length === 0 && !loading && (
                    <div className="p-12 text-center">
                        <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                        <h3 className="text-xl font-medium mb-2">Aucun mouvement trouvé</h3>
                        <p className="text-gray-500">
                            Aucun mouvement de stock trouvé pour les critères sélectionnés.
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Page {currentPage} sur {totalPages} ({totalMovements} mouvements)
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const page = i + 1;
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`px-3 py-1 rounded ${
                                                currentPage === page
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de détails */}
            <MovementDetailsModal />
        </div>
    );
};

export default StockMovementsView;