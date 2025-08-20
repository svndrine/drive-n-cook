import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    Truck,
    RefreshCw,
    Filter,
    Search,
    Download,
    Calendar,
    MapPin,
    User,
    Package,
    Euro,
    Clock,
    Star,
    FileText,
    Eye,
    Receipt,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { getFranchiseOrders, getWarehouses } from '../services/api';

const DeliveredOrdersView = ({ theme }) => {
    const [orders, setOrders] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // États pour les filtres et pagination
    const [filters, setFilters] = useState({
        search: '',
        warehouse_id: '',
        date_from: '',
        date_to: '',
        franchisee_id: '',
        sort_by: 'delivered_at',
        sort_order: 'desc'
    });
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);

    // États pour les modals
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);

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
                status: 'delivered',
                page: currentPage,
                per_page: 20
            };

            const [ordersResponse, warehousesResponse] = await Promise.all([
                getFranchiseOrders(apiFilters),
                getWarehouses()
            ]);

            if (ordersResponse?.success) {
                const data = ordersResponse.data;
                setOrders(Array.isArray(data) ? data : data?.data || []);
                setTotalPages(data?.last_page || 1);
                setTotalOrders(data?.total || 0);
            } else {
                setOrders([]);
                setTotalPages(1);
                setTotalOrders(0);
            }

            if (warehousesResponse?.success) {
                setWarehouses(Array.isArray(warehousesResponse.data) ? warehousesResponse.data : warehousesResponse.data?.data || []);
            }

        } catch (err) {
            console.error('Erreur lors du chargement des commandes:', err);
            setError('Erreur lors du chargement des données');
            setOrders([]);
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
        setCurrentPage(1); // Reset à la première page
    };

    const applyFilters = () => {
        setCurrentPage(1);
        loadData();
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            warehouse_id: '',
            date_from: '',
            date_to: '',
            franchisee_id: '',
            sort_by: 'delivered_at',
            sort_order: 'desc'
        });
        setCurrentPage(1);
    };

    // Gestion du tri
    const handleSort = (field) => {
        const newOrder = filters.sort_by === field && filters.sort_order === 'asc' ? 'desc' : 'asc';
        setFilters(prev => ({
            ...prev,
            sort_by: field,
            sort_order: newOrder
        }));
    };

    // Gestion de la pagination
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Chargement initial et au changement de page/filtres
    useEffect(() => {
        loadData();
    }, [currentPage]);

    // Fonctions utilitaires
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount || 0);
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

    const getDeliveryDuration = (confirmedAt, deliveredAt) => {
        if (!confirmedAt || !deliveredAt) return 'N/A';

        const confirmed = new Date(confirmedAt);
        const delivered = new Date(deliveredAt);
        const diffMs = delivered - confirmed;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return `${diffHours}h ${diffMinutes}min`;
    };

    const getSortIcon = (field) => {
        if (filters.sort_by !== field) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
        return filters.sort_order === 'asc' ?
            <ArrowUpDown className="w-4 h-4 text-blue-500" /> :
            <ArrowUpDown className="w-4 h-4 text-blue-500 rotate-180" />;
    };

    // Statistiques des commandes livrées
    const stats = React.useMemo(() => {
        if (!orders.length) return { total: 0, revenue: 0, avgValue: 0, avgTime: 'N/A' };

        const total = orders.length;
        const revenue = orders.reduce((sum, order) => sum + (order.total_ttc || 0), 0);
        const avgValue = revenue / total;

        const durations = orders
            .filter(o => o.confirmed_at && o.delivered_at)
            .map(o => new Date(o.delivered_at) - new Date(o.confirmed_at));

        const avgDurationMs = durations.length ?
            durations.reduce((sum, dur) => sum + dur, 0) / durations.length : 0;

        const avgHours = Math.floor(avgDurationMs / (1000 * 60 * 60));
        const avgMinutes = Math.floor((avgDurationMs % (1000 * 60 * 60)) / (1000 * 60));
        const avgTime = durations.length ? `${avgHours}h ${avgMinutes}min` : 'N/A';

        return { total, revenue, avgValue, avgTime };
    }, [orders]);

    // Modal de détails de commande
    const OrderDetailsModal = () => {
        if (!showOrderDetails || !selectedOrder) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={`p-6 rounded-xl ${cardBgClass} w-full max-w-4xl max-h-[80vh] overflow-y-auto`}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Détails de la commande livrée</h3>
                        <button
                            onClick={() => setShowOrderDetails(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Informations générales */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-3">Informations générales</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Numéro:</span>
                                        <span className="font-medium">{selectedOrder.order_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Franchisé:</span>
                                        <span className="font-medium">{selectedOrder.franchisee_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Entrepôt:</span>
                                        <span className="font-medium">{selectedOrder.warehouse_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Total TTC:</span>
                                        <span className="font-medium">{formatCurrency(selectedOrder.total_ttc)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline de livraison */}
                            <div>
                                <h4 className="font-semibold mb-3">Timeline de livraison</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Confirmée:</span>
                                        <span className="font-medium">{formatDate(selectedOrder.confirmed_at)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Livrée:</span>
                                        <span className="font-medium">{formatDate(selectedOrder.delivered_at)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Durée:</span>
                                        <span className="font-medium">{getDeliveryDuration(selectedOrder.confirmed_at, selectedOrder.delivered_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Articles commandés */}
                        <div>
                            <h4 className="font-semibold mb-3">Articles livrés</h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {selectedOrder.items?.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div>
                                            <p className="font-medium">{item.product_name}</p>
                                            <p className="text-sm text-gray-500">
                                                {item.quantity} × {formatCurrency(item.unit_price)}
                                            </p>
                                        </div>
                                        <span className="font-medium">{formatCurrency(item.total_price)}</span>
                                    </div>
                                )) || (
                                    <p className="text-gray-500 text-center py-4">Détails des articles non disponibles</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <Receipt className="w-4 h-4 mr-2" />
                            Voir la facture
                        </button>
                        <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                        </button>
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
                    <span className="text-lg">Chargement des commandes...</span>
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
                        <CheckCircle className="w-8 h-8 mr-3 text-green-500" />
                        Commandes Livrées
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Historique et suivi des commandes terminées
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
                            <p className="text-sm text-gray-500">Total Livrées</p>
                            <p className="text-2xl font-bold text-green-500">{totalOrders}</p>
                        </div>
                        <Truck className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Chiffre d'Affaires</p>
                            <p className="text-2xl font-bold text-blue-500">{formatCurrency(stats.revenue)}</p>
                        </div>
                        <Euro className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Panier Moyen</p>
                            <p className="text-2xl font-bold text-purple-500">{formatCurrency(stats.avgValue)}</p>
                        </div>
                        <Package className="w-8 h-8 text-purple-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Temps Moyen</p>
                            <p className="text-2xl font-bold text-orange-500">{stats.avgTime}</p>
                        </div>
                        <Clock className="w-8 h-8 text-orange-500" />
                    </div>
                </div>
            </div>

            {/* Filtres */}
            {showFilters && (
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Recherche</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Numéro ou franchisé..."
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

            {/* Tableau des commandes */}
            <div className={`rounded-xl border ${cardBgClass} overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                <button
                                    onClick={() => handleSort('order_number')}
                                    className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100"
                                >
                                    <span>Commande</span>
                                    {getSortIcon('order_number')}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                <button
                                    onClick={() => handleSort('franchisee_name')}
                                    className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100"
                                >
                                    <span>Franchisé</span>
                                    {getSortIcon('franchisee_name')}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Entrepôt
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                <button
                                    onClick={() => handleSort('total_ttc')}
                                    className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100"
                                >
                                    <span>Montant</span>
                                    {getSortIcon('total_ttc')}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                <button
                                    onClick={() => handleSort('delivered_at')}
                                    className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100"
                                >
                                    <span>Livrée le</span>
                                    {getSortIcon('delivered_at')}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Durée
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className={`${cardBgClass} divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {orders.map((order) => (
                            <tr key={order.id} className={hoverBgClass}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium">{order.order_number}</div>
                                    <div className="text-sm text-gray-500">{order.total_items || 'N/A'} articles</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <User className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="font-medium">{order.franchisee_name || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>{order.warehouse_name || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="font-medium">{formatCurrency(order.total_ttc)}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>{formatDate(order.delivered_at)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>{getDeliveryDuration(order.confirmed_at, order.delivered_at)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setShowOrderDetails(true);
                                            }}
                                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                                            title="Voir détails"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900 rounded-lg transition-colors"
                                            title="Voir facture"
                                        >
                                            <Receipt className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900 rounded-lg transition-colors"
                                            title="Export PDF"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Message si pas de données */}
                {orders.length === 0 && !loading && (
                    <div className="p-12 text-center">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                        <h3 className="text-xl font-medium mb-2">Aucune commande livrée</h3>
                        <p className="text-gray-500">
                            Aucune commande livrée trouvée pour les critères sélectionnés.
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Page {currentPage} sur {totalPages} ({totalOrders} commandes)
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
                                        >{page}
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
            <OrderDetailsModal />
        </div>
    );
};

export default DeliveredOrdersView;