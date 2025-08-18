// frontend-admin/src/pages/PendingOrdersView.jsx
import React, { useState, useEffect } from 'react';
import {
    Clock,
    AlertTriangle,
    Check,
    X,
    Eye,
    RefreshCw,
    Filter,
    Search,
    User,
    MapPin,
    Package,
    DollarSign,
    Calendar,
    TrendingUp,
    FileText,
    Download
} from 'lucide-react';
import {
    getFranchiseOrders,
    confirmOrder,
    cancelOrder,
    getFranchiseOrder,
    getWarehouses
} from '../services/api.js';

/**
 * Composant pour gérer les commandes en attente de validation
 * @param {object} props - Propriétés du composant
 * @param {string} props.theme - Thème actuel (dark/light)
 */
const PendingOrdersView = ({ theme }) => {
    // États du composant
    const [orders, setOrders] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [processingOrders, setProcessingOrders] = useState(new Set());

    // États pour la modal de détails
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

    // États des filtres
    const [filters, setFilters] = useState({
        warehouse_id: '',
        search: '',
        date_from: '',
        date_to: '',
        urgent_only: false // Commandes avec ratio < 80%
    });
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // États pour les actions en lot
    const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());
    const [showBulkActions, setShowBulkActions] = useState(false);

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

            // Filtres pour ne récupérer que les commandes en attente
            const apiFilters = {
                status: 'pending',
                page: currentPage,
                per_page: 20,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([key, value]) => {
                        if (key === 'urgent_only') return false; // Géré côté client
                        return value !== '' && value !== false;
                    })
                )
            };

            // Chargement en parallèle
            const [ordersData, warehousesData] = await Promise.all([
                getFranchiseOrders(apiFilters),
                getWarehouses().catch(() => ({ data: [] }))
            ]);

            let ordersResult = Array.isArray(ordersData.data) ? ordersData.data :
                Array.isArray(ordersData) ? ordersData : [];


            // Filtrage côté client pour les commandes urgentes (ratio < 80%)
            if (filters.urgent_only) {
                ordersResult = ordersResult.filter(order =>
                    (order.mandatory_percentage || 0) < 80
                );
            }

            setOrders(ordersResult);
            setTotalPages(ordersData.last_page || 1);
            setWarehouses(Array.isArray(warehousesData.data) ? warehousesData.data : []);

        } catch (err) {
            console.error('Erreur lors du chargement des commandes en attente:', err);
            setError(err.message);
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
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(1);
    };

    // Application des filtres
    const applyFilters = () => {
        setCurrentPage(1);
        loadData();
    };

    // Reset des filtres
    const resetFilters = () => {
        setFilters({
            warehouse_id: '',
            search: '',
            date_from: '',
            date_to: '',
            urgent_only: false
        });
        setCurrentPage(1);
    };

    // Charger les détails d'une commande
    const loadOrderDetails = async (orderId) => {
        setLoadingOrderDetails(true);
        try {
            const data = await getFranchiseOrder(orderId);
            setSelectedOrder(data.data || data);
            setShowOrderDetails(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingOrderDetails(false);
        }
    };

    // Actions sur les commandes
    const handleConfirmOrder = async (orderId) => {
        if (processingOrders.has(orderId)) return;

        setProcessingOrders(prev => new Set(prev).add(orderId));
        try {
            await confirmOrder(orderId);
            await loadData(); // Recharger les données

            // Retirer de la sélection si elle était sélectionnée
            setSelectedOrderIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(orderId);
                return newSet;
            });
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

    const handleRejectOrder = async (orderId, reason = 'Commande rejetée par admin') => {
        if (processingOrders.has(orderId)) return;
        if (!confirm('Êtes-vous sûr de vouloir rejeter cette commande ?')) return;

        setProcessingOrders(prev => new Set(prev).add(orderId));
        try {
            await cancelOrder(orderId, reason);
            await loadData();

            setSelectedOrderIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(orderId);
                return newSet;
            });
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

    // Actions en lot
    const handleSelectAll = () => {
        if (selectedOrderIds.size === orders.length) {
            setSelectedOrderIds(new Set());
        } else {
            setSelectedOrderIds(new Set(orders.map(order => order.id)));
        }
    };

    const handleSelectOrder = (orderId) => {
        setSelectedOrderIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const handleBulkConfirm = async () => {
        if (selectedOrderIds.size === 0) return;
        if (!confirm(`Confirmer ${selectedOrderIds.size} commande(s) ?`)) return;

        const orderIds = Array.from(selectedOrderIds);
        setProcessingOrders(prev => new Set([...prev, ...orderIds]));

        try {
            await Promise.all(orderIds.map(id => confirmOrder(id)));
            await loadData();
            setSelectedOrderIds(new Set());
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessingOrders(prev => {
                const newSet = new Set(prev);
                orderIds.forEach(id => newSet.delete(id));
                return newSet;
            });
        }
    };

    const handleBulkReject = async () => {
        if (selectedOrderIds.size === 0) return;
        if (!confirm(`Rejeter ${selectedOrderIds.size} commande(s) ?`)) return;

        const orderIds = Array.from(selectedOrderIds);
        setProcessingOrders(prev => new Set([...prev, ...orderIds]));

        try {
            await Promise.all(orderIds.map(id => cancelOrder(id, 'Rejet en lot par admin')));
            await loadData();
            setSelectedOrderIds(new Set());
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessingOrders(prev => {
                const newSet = new Set(prev);
                orderIds.forEach(id => newSet.delete(id));
                return newSet;
            });
        }
    };

    // Chargement initial
    useEffect(() => {
        loadData();
    }, [currentPage]);

    // Mise à jour des actions en lot
    useEffect(() => {
        setShowBulkActions(selectedOrderIds.size > 0);
    }, [selectedOrderIds]);

    // Fonctions utilitaires
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

    const getUrgencyLevel = (order) => {
        const ratio = order.mandatory_percentage || 0;
        const hoursOld = Math.floor((new Date() - new Date(order.created_at)) / (1000 * 60 * 60));

        if (ratio < 80) return { level: 'high', text: 'Urgent', color: 'text-red-500' };
        if (hoursOld > 24) return { level: 'medium', text: 'Modéré', color: 'text-orange-500' };
        return { level: 'low', text: 'Normal', color: 'text-green-500' };
    };

    // Statistiques rapides
    const stats = React.useMemo(() => {
        const ordersArray = Array.isArray(orders) ? orders : [];

        return {
            total: ordersArray.length,
            urgent: ordersArray.filter(o => (o.mandatory_percentage || 0) < 80).length,
            totalValue: ordersArray.reduce((sum, o) => sum + (o.total_ttc || 0), 0),
            avgProcessingTime: '2.3h'
        };
    }, [orders]);

    // Affichage du loading
    if (loading) {
        return (
            <div className={`p-8 ${bgClass} ${textClass} min-h-screen flex items-center justify-center`}>
                <div className="flex items-center space-x-2">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span className="text-lg">Chargement des commandes en attente...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-8 space-y-6 ${bgClass} ${textClass} min-h-screen`}>
            {/* En-tête avec actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center">
                        <Clock className="w-8 h-8 mr-3 text-yellow-500" />
                        Commandes en attente de validation
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {stats.total} commandes nécessitent votre attention
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Commandes en attente</p>
                            <p className="text-2xl font-bold text-yellow-500">{stats.total}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Urgentes (ratio &lt; 80%)</p>
                            <p className="text-2xl font-bold text-red-500">{stats.urgent}</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Valeur totale</p>
                            <p className="text-2xl font-bold text-green-500">
                                {formatCurrency(stats.totalValue)}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Temps de traitement moyen</p>
                            <p className="text-2xl font-bold text-blue-500">{stats.avgProcessingTime}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
            </div>

            {/* Actions en lot */}
            {showBulkActions && (
                <div className={`p-4 rounded-xl border-2 border-blue-500 ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <span className="font-medium">
                            {selectedOrderIds.size} commande(s) sélectionnée(s)
                        </span>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleBulkConfirm}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Confirmer toutes
                            </button>
                            <button
                                onClick={handleBulkReject}
                                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Rejeter toutes
                            </button>
                            <button
                                onClick={() => setSelectedOrderIds(new Set())}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtres */}
            {showFilters && (
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

                        <div>
                            <label className="block text-sm font-medium mb-2">Options</label>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={filters.urgent_only}
                                    onChange={(e) => handleFilterChange('urgent_only', e.target.checked)}
                                    className="mr-2"
                                />
                                <span className="text-sm">Urgentes seulement</span>
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
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">
                            Commandes en attente ({orders.length})
                        </h2>
                        {orders.length > 0 && (
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedOrderIds.size === orders.length && orders.length > 0}
                                        onChange={handleSelectAll}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">Tout sélectionner</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {orders.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-medium mb-2">Aucune commande en attente</h3>
                        <p>Toutes les commandes ont été traitées !</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700">
                        {orders.map((order) => {
                            const urgency = getUrgencyLevel(order);
                            const isSelected = selectedOrderIds.has(order.id);
                            const isProcessing = processingOrders.has(order.id);

                            return (
                                <div
                                    key={order.id}
                                    className={`p-6 transition-colors ${hoverBgClass} ${
                                        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        {/* Checkbox et infos de base */}
                                        <div className="flex items-center space-x-4">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectOrder(order.id)}
                                                className="w-4 h-4"
                                            />

                                            <div className="flex items-center space-x-4">
                                                {/* Indicateur d'urgence */}
                                                <div className={`w-3 h-3 rounded-full ${
                                                    urgency.level === 'high' ? 'bg-red-500' :
                                                        urgency.level === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                                                }`}></div>

                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="text-lg font-semibold">
                                                            {order.order_number}
                                                        </h3>
                                                        <span className={`text-sm font-medium ${urgency.color}`}>
                                                            {urgency.text}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                                                        <span className="flex items-center">
                                                            <User className="w-4 h-4 mr-1" />
                                                            {order.franchisee_name || (order.user?.firstname + ' ' + order.user?.lastname)}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <MapPin className="w-4 h-4 mr-1" />
                                                            {order.warehouse?.name}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1" />
                                                            {formatDate(order.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Métriques et actions */}
                                        <div className="flex items-center space-x-8">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-400">Articles</p>
                                                <p className="text-lg font-semibold">{order.items_count}</p>
                                            </div>

                                            <div className="text-center">
                                                <p className="text-sm text-gray-400">Montant</p>
                                                <p className="text-lg font-semibold">
                                                    {formatCurrency(order.total_ttc)}
                                                </p>
                                            </div>

                                            <div className="text-center">
                                                <p className="text-sm text-gray-400">Ratio 80/20</p>
                                                <p className={`text-lg font-semibold ${
                                                    (order.mandatory_percentage || 0) >= 80 ? 'text-green-500' : 'text-red-500'
                                                }`}>
                                                    {Math.round(order.mandatory_percentage || 0)}%
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => loadOrderDetails(order.id)}
                                                    disabled={loadingOrderDetails}
                                                    className="p-2 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                                                    title="Voir détails"
                                                >
                                                    {loadingOrderDetails ? (
                                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <Eye className="w-5 h-5" />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => handleConfirmOrder(order.id)}
                                                    disabled={isProcessing}
                                                    className="p-2 text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                                                    title="Confirmer"
                                                >
                                                    {isProcessing ? (
                                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <Check className="w-5 h-5" />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => handleRejectOrder(order.id)}
                                                    disabled={isProcessing}
                                                    className="p-2 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                                    title="Rejeter"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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

            {/* Modal de détails de commande */}
            {showOrderDetails && selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    isOpen={showOrderDetails}
                    onClose={() => {
                        setShowOrderDetails(false);
                        setSelectedOrder(null);
                    }}
                    theme={theme}
                    onConfirm={() => {
                        handleConfirmOrder(selectedOrder.id);
                        setShowOrderDetails(false);
                        setSelectedOrder(null);
                    }}
                    onReject={() => {
                        handleRejectOrder(selectedOrder.id);
                        setShowOrderDetails(false);
                        setSelectedOrder(null);
                    }}
                />
            )}
        </div>
    );
};

/**
 * Modal pour afficher les détails d'une commande en attente
 */
const OrderDetailsModal = ({ order, isOpen, onClose, theme, onConfirm, onReject }) => {
    const modalBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const textClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    const cardBgClass = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50';

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

    if (!isOpen || !order) return null;

    const urgency = (order.mandatory_percentage || 0) < 80 ? 'high' : 'normal';
    const urgencyColor = urgency === 'high' ? 'text-red-500' : 'text-green-500';
    const urgencyBg = urgency === 'high' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className={`max-w-5xl w-full max-h-[90vh] overflow-y-auto rounded-xl ${modalBgClass} ${textClass}`}>
                {/* En-tête */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center">
                            <FileText className="w-6 h-6 mr-2" />
                            Détails de la commande {order.order_number}
                        </h2>
                        <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm border ${urgencyBg}`}>
                            <AlertTriangle className={`w-4 h-4 mr-1 ${urgencyColor}`} />
                            <span className={urgencyColor}>
                                {urgency === 'high' ? 'Attention: Ratio insuffisant' : 'Ratio conforme'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Contenu */}
                <div className="p-6 space-y-6">
                    {/* Informations générales */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={`p-4 rounded-lg ${cardBgClass}`}>
                            <h3 className="text-lg font-semibold flex items-center mb-3">
                                <User className="w-5 h-5 mr-2" />
                                Franchisé
                            </h3>
                            <div className="space-y-2">
                                <p className="font-medium">
                                    {order.user?.firstname} {order.user?.lastname}
                                </p>
                                <p className="text-sm text-gray-500">{order.user?.email}</p>
                                <p className="text-sm text-gray-500">
                                    Franchisé depuis: {order.user?.created_at ? formatDate(order.user.created_at) : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg ${cardBgClass}`}>
                            <h3 className="text-lg font-semibold flex items-center mb-3">
                                <MapPin className="w-5 h-5 mr-2" />
                                Entrepôt
                            </h3>
                            <div className="space-y-2">
                                <p className="font-medium">{order.warehouse?.name}</p>
                                <p className="text-sm text-gray-500">{order.warehouse?.address}</p>
                                <p className="text-sm text-gray-500">
                                    📧 {order.warehouse?.email}
                                </p>
                                <p className="text-sm text-gray-500">
                                    📞 {order.warehouse?.phone}
                                </p>
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg ${cardBgClass}`}>
                            <h3 className="text-lg font-semibold flex items-center mb-3">
                                <Calendar className="w-5 h-5 mr-2" />
                                Informations commande
                            </h3>
                            <div className="space-y-2">
                                <p className="text-sm">
                                    <span className="text-gray-500">Créée:</span> {formatDate(order.created_at)}
                                </p>
                                <p className="text-sm">
                                    <span className="text-gray-500">Mise à jour:</span> {formatDate(order.updated_at)}
                                </p>
                                <p className="text-sm">
                                    <span className="text-gray-500">Articles:</span> {order.items?.length || 0}
                                </p>
                                <p className="text-sm">
                                    <span className="text-gray-500">Statut:</span>
                                    <span className="ml-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                                        En attente
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Analyse du ratio 80/20 */}
                    <div className={`p-6 rounded-lg border-2 ${
                        urgency === 'high' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                    }`}>
                        <h3 className="text-lg font-semibold mb-4">Analyse du ratio 80/20</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Ratio actuel</p>
                                <p className={`text-3xl font-bold ${urgencyColor}`}>
                                    {Math.round(order.mandatory_percentage || 0)}%
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Requis minimum</p>
                                <p className="text-3xl font-bold text-gray-600">80%</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Statut</p>
                                <p className={`text-lg font-semibold ${urgencyColor}`}>
                                    {urgency === 'high' ? '⚠️ Non conforme' : '✅ Conforme'}
                                </p>
                            </div>
                        </div>
                        {urgency === 'high' && (
                            <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                                <p className="text-red-800 text-sm">
                                    <strong>Attention:</strong> Cette commande ne respecte pas le ratio obligatoire de 80%.
                                    Vous pouvez la rejeter ou contacter le franchisé pour modification.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Articles commandés */}
                    <div>
                        <h3 className="text-lg font-semibold flex items-center mb-4">
                            <Package className="w-5 h-5 mr-2" />
                            Articles commandés ({order.items?.length || 0})
                        </h3>
                        <div className="border border-gray-700 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Produit</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium">Quantité</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium">Prix unitaire</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium">Type</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                {order.items?.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium">{item.product?.name}</p>
                                                {item.product?.description && (
                                                    <p className="text-sm text-gray-500">{item.product.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total_price)}</td>
                                        <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    item.product?.is_mandatory
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {item.product?.is_mandatory ? 'Obligatoire' : 'Libre'}
                                                </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totaux */}
                    <div className="border-t border-gray-700 pt-6">
                        <div className="flex justify-end">
                            <div className="w-80 space-y-3">
                                <div className="flex justify-between text-lg">
                                    <span>Total HT:</span>
                                    <span className="font-medium">{formatCurrency(order.total_ht)}</span>
                                </div>
                                <div className="flex justify-between text-lg">
                                    <span>TVA:</span>
                                    <span className="font-medium">{formatCurrency(order.total_tva)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-xl border-t border-gray-700 pt-3">
                                    <span>Total TTC:</span>
                                    <span className="text-green-600">{formatCurrency(order.total_ttc)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Fermer
                    </button>
                    <button
                        onClick={onReject}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Rejeter
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PendingOrdersView;