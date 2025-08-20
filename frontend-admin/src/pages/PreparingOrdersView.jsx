import React, { useState, useEffect } from 'react';
import {
    Clock,
    ChefHat,
    CheckCircle,
    RefreshCw,
    Filter,
    Search,
    MapPin,
    Package,
    User,
    Timer,
    AlertTriangle,
    Utensils,
    Calendar,
    Eye,
    ArrowRight,
    Pause,
    Play,
    Truck,
    Bell,
    Star,
    MoreVertical
} from 'lucide-react';
import { getFranchiseOrders, updateOrderStatus } from '../services/api';

const PreparingOrdersView = ({ theme }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // États pour les filtres
    const [filters, setFilters] = useState({
        warehouse_id: '',
        search: '',
        priority: '',
        preparation_time: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    // États pour les actions
    const [processingOrders, setProcessingOrders] = useState(new Set());
    const [selectedOrderId, setSelectedOrderId] = useState(null);
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

            // Données simulées pour les commandes en préparation
            const mockOrders = [
                {
                    id: 1,
                    order_number: "CMD-202501-001",
                    franchisee_name: "Sophie Martin",
                    franchisee_phone: "06 12 34 56 78",
                    warehouse_name: "IDF-01 Paris Nord",
                    warehouse_id: 1,
                    status: "preparing",
                    total_items: 8,
                    total_ttc: 245.80,
                    confirmed_at: "2025-08-20T09:30:00Z",
                    preparation_started_at: "2025-08-20T10:15:00Z",
                    estimated_completion: "2025-08-20T11:45:00Z",
                    priority: "high",
                    preparation_time_minutes: 90,
                    elapsed_minutes: 45,
                    items: [
                        { product_name: "Burger Classic", quantity: 12, status: "completed" },
                        { product_name: "Salade César", quantity: 8, status: "in_progress" },
                        { product_name: "Frites maison", quantity: 15, status: "pending" },
                        { product_name: "Coca-Cola", quantity: 20, status: "completed" }
                    ],
                    notes: "Livraison urgente pour événement client"
                },
                {
                    id: 2,
                    order_number: "CMD-202501-002",
                    franchisee_name: "Marc Dubois",
                    franchisee_phone: "06 98 76 54 32",
                    warehouse_name: "IDF-02 Paris Est",
                    warehouse_id: 2,
                    status: "preparing",
                    total_items: 12,
                    total_ttc: 398.50,
                    confirmed_at: "2025-08-20T08:45:00Z",
                    preparation_started_at: "2025-08-20T09:30:00Z",
                    estimated_completion: "2025-08-20T12:00:00Z",
                    priority: "medium",
                    preparation_time_minutes: 150,
                    elapsed_minutes: 105,
                    items: [
                        { product_name: "Quiche Lorraine", quantity: 6, status: "completed" },
                        { product_name: "Croque-Monsieur", quantity: 10, status: "completed" },
                        { product_name: "Tiramisu", quantity: 8, status: "in_progress" },
                        { product_name: "Café expresso", quantity: 25, status: "pending" }
                    ],
                    notes: "Commander spécial pour mariage"
                },
                {
                    id: 3,
                    order_number: "CMD-202501-003",
                    franchisee_name: "Julie Leroy",
                    franchisee_phone: "06 45 67 89 12",
                    warehouse_name: "IDF-03 Paris Ouest",
                    warehouse_id: 3,
                    status: "preparing",
                    total_items: 5,
                    total_ttc: 156.20,
                    confirmed_at: "2025-08-20T10:00:00Z",
                    preparation_started_at: "2025-08-20T10:45:00Z",
                    estimated_completion: "2025-08-20T11:30:00Z",
                    priority: "low",
                    preparation_time_minutes: 45,
                    elapsed_minutes: 15,
                    items: [
                        { product_name: "Salade de fruits", quantity: 10, status: "in_progress" },
                        { product_name: "Eau minérale", quantity: 24, status: "completed" },
                        { product_name: "Macarons assortis", quantity: 12, status: "pending" }
                    ],
                    notes: ""
                }
            ];

            // Appliquer les filtres
            let filteredOrders = [...mockOrders];

            if (filters.search) {
                filteredOrders = filteredOrders.filter(o =>
                    o.order_number.toLowerCase().includes(filters.search.toLowerCase()) ||
                    o.franchisee_name.toLowerCase().includes(filters.search.toLowerCase())
                );
            }

            if (filters.warehouse_id) {
                filteredOrders = filteredOrders.filter(o =>
                    o.warehouse_id.toString() === filters.warehouse_id
                );
            }

            if (filters.priority) {
                filteredOrders = filteredOrders.filter(o =>
                    o.priority === filters.priority
                );
            }

            setOrders(filteredOrders);

        } catch (err) {
            console.error('Erreur lors du chargement des commandes:', err);
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

    // Gestion des actions sur les commandes
    const handleMarkAsReady = async (orderId) => {
        if (processingOrders.has(orderId)) return;

        setProcessingOrders(prev => new Set(prev).add(orderId));
        try {
            console.log('Marquer comme prêt:', orderId);
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

    const handlePauseOrder = async (orderId) => {
        if (processingOrders.has(orderId)) return;

        setProcessingOrders(prev => new Set(prev).add(orderId));
        try {
            console.log('Mettre en pause:', orderId);
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
    }, []);

    // Fonctions utilitaires
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-500 bg-red-100 border-red-200';
            case 'medium': return 'text-orange-500 bg-orange-100 border-orange-200';
            case 'low': return 'text-green-500 bg-green-100 border-green-200';
            default: return 'text-gray-500 bg-gray-100 border-gray-200';
        }
    };

    const getPriorityText = (priority) => {
        switch (priority) {
            case 'high': return 'Urgente';
            case 'medium': return 'Normale';
            case 'low': return 'Faible';
            default: return priority;
        }
    };

    const getItemStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-100';
            case 'in_progress': return 'text-orange-600 bg-orange-100';
            case 'pending': return 'text-gray-600 bg-gray-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getItemStatusText = (status) => {
        switch (status) {
            case 'completed': return 'Terminé';
            case 'in_progress': return 'En cours';
            case 'pending': return 'En attente';
            default: return status;
        }
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getProgressPercentage = (elapsed, total) => {
        return Math.min((elapsed / total) * 100, 100);
    };

    // Statistiques
    const stats = React.useMemo(() => {
        return {
            total: orders.length,
            urgent: orders.filter(o => o.priority === 'high').length,
            avgTime: orders.reduce((acc, o) => acc + o.elapsed_minutes, 0) / (orders.length || 1),
            completing: orders.filter(o => o.elapsed_minutes >= o.preparation_time_minutes * 0.8).length
        };
    }, [orders]);

    // Modal de détails de commande
    const OrderDetailsModal = () => {
        const order = orders.find(o => o.id === selectedOrderId);
        if (!showOrderDetails || !order) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={`p-6 rounded-xl ${cardBgClass} w-full max-w-2xl max-h-[80vh] overflow-y-auto`}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Détails de la commande</h3>
                        <button
                            onClick={() => setShowOrderDetails(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Numéro de commande</p>
                                <p className="font-medium">{order.order_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Franchisé</p>
                                <p className="font-medium">{order.franchisee_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Téléphone</p>
                                <p className="font-medium">{order.franchisee_phone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Entrepôt</p>
                                <p className="font-medium">{order.warehouse_name}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-3">Articles à préparer</h4>
                            <div className="space-y-2">
                                {order.items.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div>
                                            <p className="font-medium">{item.product_name}</p>
                                            <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getItemStatusColor(item.status)}`}>
                                            {getItemStatusText(item.status)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {order.notes && (
                            <div>
                                <p className="text-sm text-gray-500">Notes spéciales</p>
                                <p className="font-medium bg-yellow-50 dark:bg-yellow-900 p-3 rounded-lg">
                                    {order.notes}
                                </p>
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
                        <ChefHat className="w-8 h-8 mr-3 text-orange-500" />
                        Commandes en Préparation
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Interface de cuisine pour la préparation des commandes
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
                </div>
            </div>

            {/* Erreur */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-red-800">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Erreur</span>
                    </div>
                    <p className="mt-1 text-red-700">{error}</p>
                </div>
            )}

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Commandes actives</p>
                            <p className="text-2xl font-bold text-orange-500">{stats.total}</p>
                        </div>
                        <Utensils className="w-8 h-8 text-orange-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Urgentes</p>
                            <p className="text-2xl font-bold text-red-500">{stats.urgent}</p>
                        </div>
                        <Bell className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Temps moyen</p>
                            <p className="text-2xl font-bold text-blue-500">{formatDuration(Math.round(stats.avgTime))}</p>
                        </div>
                        <Timer className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Bientôt prêtes</p>
                            <p className="text-2xl font-bold text-green-500">{stats.completing}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                </div>
            </div>

            {/* Filtres */}
            {showFilters && (
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Recherche</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Numéro commande ou franchisé..."
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Entrepôt</label>
                            <select
                                value={filters.warehouse_id}
                                onChange={(e) => setFilters(prev => ({ ...prev, warehouse_id: e.target.value }))}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="">Tous les entrepôts</option>
                                <option value="1">IDF-01 Paris Nord</option>
                                <option value="2">IDF-02 Paris Est</option>
                                <option value="3">IDF-03 Paris Ouest</option>
                                <option value="4">IDF-04 Paris Sud</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Priorité</label>
                            <select
                                value={filters.priority}
                                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="">Toutes les priorités</option>
                                <option value="high">Urgente</option>
                                <option value="medium">Normale</option>
                                <option value="low">Faible</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ warehouse_id: '', search: '', priority: '', preparation_time: '' })}
                                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Liste des commandes */}
            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className={`p-12 text-center rounded-xl border ${cardBgClass}`}>
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50" />
                        <h3 className="text-xl font-medium mb-2">Aucune commande en préparation</h3>
                        <p className="text-gray-500">Toutes les commandes sont prêtes ou terminées !</p>
                    </div>
                ) : (
                    orders.map((order) => {
                        const isProcessing = processingOrders.has(order.id);
                        const progressPercentage = getProgressPercentage(order.elapsed_minutes, order.preparation_time_minutes);
                        const isNearCompletion = progressPercentage >= 80;
                        const isOvertime = order.elapsed_minutes > order.preparation_time_minutes;

                        return (
                            <div key={order.id} className={`p-6 rounded-xl border ${cardBgClass} ${hoverBgClass} transition-colors`}>
                                <div className="flex items-start justify-between">
                                    {/* Informations principales */}
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <h3 className="text-xl font-bold">{order.order_number}</h3>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(order.priority)}`}>
                                                {getPriorityText(order.priority)}
                                            </span>
                                            {isOvertime && (
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                    EN RETARD
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Franchisé</p>
                                                <p className="font-medium">{order.franchisee_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Entrepôt</p>
                                                <p className="font-medium flex items-center">
                                                    <MapPin className="w-4 h-4 mr-1" />
                                                    {order.warehouse_name}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Articles</p>
                                                <p className="font-medium">{order.total_items} articles</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Total</p>
                                                <p className="font-medium">{order.total_ttc.toFixed(2)} €</p>
                                            </div>
                                        </div>

                                        {/* Temps et progression */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span>Progression : {formatDuration(order.elapsed_minutes)} / {formatDuration(order.preparation_time_minutes)}</span>
                                                <span className={`font-medium ${isOvertime ? 'text-red-500' : isNearCompletion ? 'text-orange-500' : 'text-blue-500'}`}>
                                                    {Math.round(progressPercentage)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-300 ${
                                                        isOvertime ? 'bg-red-500' : isNearCompletion ? 'bg-orange-500' : 'bg-blue-500'
                                                    }`}
                                                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>Début: {formatTime(order.preparation_started_at)}</span>
                                                <span>Fin prévue: {formatTime(order.estimated_completion)}</span>
                                            </div>
                                        </div>

                                        {/* Articles avec statuts */}
                                        <div className="mt-4">
                                            <div className="flex flex-wrap gap-2">
                                                {order.items.map((item, index) => (
                                                    <div key={index} className={`px-2 py-1 text-xs rounded-full ${getItemStatusColor(item.status)}`}>
                                                        {item.product_name} ({item.quantity})
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {order.notes && (
                                            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                                                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                                    📝 {order.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col space-y-2 ml-6">
                                        <button
                                            onClick={() => handleMarkAsReady(order.id)}
                                            disabled={isProcessing}
                                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Prêt
                                        </button>

                                        <button
                                            onClick={() => handlePauseOrder(order.id)}
                                            disabled={isProcessing}
                                            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                                        >
                                            <Pause className="w-4 h-4 mr-2" />
                                            Pause
                                        </button>

                                        <button
                                            onClick={() => {
                                                setSelectedOrderId(order.id);
                                                setShowOrderDetails(true);
                                            }}
                                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            Détails
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal de détails */}
            <OrderDetailsModal />
        </div>
    );
};

export default PreparingOrdersView;