// ========================================
// frontend-admin/src/pages/AllOrdersView.jsx
// ========================================

import React, { useState, useEffect } from 'react';
import {
    ShoppingCart,
    Calendar,
    Package,
    TrendingUp,
    AlertTriangle,
    Filter,
    RefreshCw,
    Eye,
    Check,
    X,
    Clock,
    Truck,
    Download,
    Search,
    MapPin,
    User,
    DollarSign
} from 'lucide-react';
import {
    getFranchiseOrders,
    getOrderStats,
    confirmOrder,
    updateOrderStatus,
    cancelOrder,
    getWarehouses
} from '../services/api.js';

/**
 * Composant Gestion de toutes les commandes
 * @param {object} props - Propriétés du composant
 * @param {string} props.theme - Thème actuel (dark/light)
 */
const AllOrdersView = ({ theme }) => {
    // États du composant
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [processingOrders, setProcessingOrders] = useState(new Set());

    // États des filtres
    const [filters, setFilters] = useState({
        status: '',
        warehouse_id: '',
        search: '',
        date_from: '',
        date_to: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Classes CSS conditionnelles selon le thème
    const bgClass = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';
    const textClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    const cardBgClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const hoverBgClass = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
    const inputBgClass = theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';

    // Fonction pour charger les données
    const loadData = async () => {
        try {
            setError(null);

            // Préparation des filtres pour l'API
            const apiFilters = {
                page: currentPage,
                per_page: 20,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value !== '')
                )
            };

            // Chargement en parallèle
            const [ordersData, statsData, warehousesData] = await Promise.all([
                getFranchiseOrders(apiFilters),
                getOrderStats(filters),
                getWarehouses().catch(() => ({ data: [] })) // Non-bloquant
            ]);

            setOrders(ordersData.data || []);
            setTotalPages(ordersData.last_page || 1);
            setStats(statsData.data || statsData);
            setWarehouses(warehousesData.data || []);

        } catch (err) {
            console.error('Erreur lors du chargement des commandes:', err);
            setError(err.message);
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
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(1); // Reset pagination
    };

    // Application des filtres
    const applyFilters = () => {
        setCurrentPage(1);
        loadData();
    };

    // Reset des filtres
    const resetFilters = () => {
        setFilters({
            status: '',
            warehouse_id: '',
            search: '',
            date_from: '',
            date_to: ''
        });
        setCurrentPage(1);
    };

    // Actions sur les commandes
    const handleConfirmOrder = async (orderId) => {
        if (processingOrders.has(orderId)) return;

        setProcessingOrders(prev => new Set(prev).add(orderId));
        try {
            await confirmOrder(orderId);
            await loadData(); // Recharger les données
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessingOrders(prev => {
                const newSet = new Set(prev);
                newSet.delete(orderId);
                return newSet;
            });
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        if (processingOrders.has(orderId)) return;

        setProcessingOrders(prev => new Set(prev).add(orderId));
        try {
            await updateOrderStatus(orderId, newStatus);
            await loadData();
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessingOrders(prev => {
                const newSet = new Set(prev);
                newSet.delete(orderId);
                return newSet;
            });
        }
    };

    const handleCancelOrder = async (orderId, reason = 'Annulé par admin') => {
        if (processingOrders.has(orderId)) return;
        if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;

        setProcessingOrders(prev => new Set(prev).add(orderId));
        try {
            await cancelOrder(orderId, reason);
            await loadData();
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessingOrders(prev => {
                const newSet = new Set(prev);
                newSet.delete(orderId);
                return newSet;
            });
        }
    };

    // Chargement initial
    useEffect(() => {
        loadData();
    }, [currentPage]);

    // Fonctions utilitaires
    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800',
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            preparing: 'bg-orange-100 text-orange-800',
            ready: 'bg-green-100 text-green-800',
            delivered: 'bg-emerald-100 text-emerald-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || colors.draft;
    };

    const getStatusText = (status) => {
        const texts = {
            draft: 'Brouillon',
            pending: 'En attente',
            confirmed: 'Confirmée',
            preparing: 'En préparation',
            ready: 'Prête',
            delivered: 'Livrée',
            cancelled: 'Annulée'
        };
        return texts[status] || status;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    };

    // Affichage du loading
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
            {/* En-tête avec actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gestion des Commandes</h1>
                    <p className="text-gray-500 mt-1">
                        Suivi et validation des commandes franchisés
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

            {/* Affichage d'erreur */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-red-800">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Erreur</span>
                    </div>
                    <p className="mt-1 text-red-700">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="mt-2 text-red-600 hover:text-red-800"
                    >
                        Fermer
                    </button>
                </div>
            )}

            {/* Statistiques rapides */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">En attente validation</p>
                                <p className="text-2xl font-bold text-yellow-500">
                                    {stats.pending_count || 0}
                                </p>
                            </div>
                            <Calendar className="w-8 h-8 text-yellow-500" />
                        </div>
                    </div>

                    <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">En préparation</p>
                                <p className="text-2xl font-bold text-orange-500">
                                    {stats.preparing_count || 0}
                                </p>
                            </div>
                            <Package className="w-8 h-8 text-orange-500" />
                        </div>
                    </div>

                    <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">CA du jour</p>
                                <p className="text-2xl font-bold text-green-500">
                                    {formatCurrency(stats.daily_revenue || 0)}
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Ratio 80/20 moyen</p>
                                <p className="text-2xl font-bold text-blue-500">
                                    {Math.round(stats.average_mandatory_percentage || 0)}%
                                </p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filtres */}
            {showFilters && (
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Statut</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="">Tous les statuts</option>
                                <option value="pending">En attente</option>
                                <option value="confirmed">Confirmées</option>
                                <option value="preparing">En préparation</option>
                                <option value="ready">Prêtes</option>
                                <option value="delivered">Livrées</option>
                                <option value="cancelled">Annulées</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Entrepôt</label>
                            <select
                                value={filters.warehouse_id}
                                onChange={(e) => handleFilterChange('warehouse_id', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="">Tous les entrepôts</option>
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

                        <div>
                            <label className="block text-sm font-medium mb-2">Recherche</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="N° commande, franchisé..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-3 mt-4">
                        <button
                            onClick={applyFilters}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            )}

            {/* Liste des commandes */}
            <div className={`rounded-xl border ${cardBgClass} overflow-hidden`}>
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold">
                        Commandes ({orders.length} sur cette page)
                    </h2>
                </div>

                {orders.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Aucune commande trouvée</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}>
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                                    Commande
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                                    Franchisé
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                                    Entrepôt
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                                    Montant
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                                    Ratio 80/20
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                                    Statut
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                            {orders.map((order) => (
                                <tr key={order.id} className={`transition-colors ${hoverBgClass}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium">
                                                {order.order_number}
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {order.items_count} articles
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {formatDate(order.created_at)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <User className="w-4 h-4 mr-2 text-gray-400" />
                                            <span className="text-sm">
                                                    {order.franchisee_name || order.user?.firstname + ' ' + order.user?.lastname}
                                                </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                            <span className="text-sm">
                                                    {order.warehouse?.name || 'N/A'}
                                                </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium">
                                                {formatCurrency(order.total_ttc)}
                                            </div>
                                            <div className="text-xs text-gray-400">TTC</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`text-sm font-medium ${
                                            (order.mandatory_percentage || 0) >= 80 ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                            {Math.round(order.mandatory_percentage || 0)}%
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        <div className="flex space-x-1">
                                            {/* Bouton Voir détails */}
                                            <button className="p-1 text-blue-600 hover:text-blue-800 transition-colors">
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            {/* Actions selon le statut */}
                                            {order.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleConfirmOrder(order.id)}
                                                        disabled={processingOrders.has(order.id)}
                                                        className="p-1 text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                                                        title="Confirmer"
                                                    >
                                                        {processingOrders.has(order.id) ? (
                                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Check className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelOrder(order.id)}
                                                        disabled={processingOrders.has(order.id)}
                                                        className="p-1 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                                        title="Rejeter"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}

                                            {order.status === 'confirmed' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, 'preparing')}
                                                    disabled={processingOrders.has(order.id)}
                                                    className="p-1 text-orange-600 hover:text-orange-800 transition-colors disabled:opacity-50"
                                                    title="Mettre en préparation"
                                                >
                                                    {processingOrders.has(order.id) ? (
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Clock className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}

                                            {order.status === 'preparing' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, 'ready')}
                                                    disabled={processingOrders.has(order.id)}
                                                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                                                    title="Marquer comme prête"
                                                >
                                                    {processingOrders.has(order.id) ? (
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Package className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}

                                            {order.status === 'ready' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                                    disabled={processingOrders.has(order.id)}
                                                    className="p-1 text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                                                    title="Marquer comme livrée"
                                                >
                                                    {processingOrders.has(order.id) ? (
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Truck className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Page {currentPage} sur {totalPages}
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            Précédent
                        </button>

                        {/* Pages */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                            if (page > totalPages) return null;

                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-2 rounded-lg transition-colors ${
                                        currentPage === page
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-600 text-white hover:bg-gray-700'
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllOrdersView;
