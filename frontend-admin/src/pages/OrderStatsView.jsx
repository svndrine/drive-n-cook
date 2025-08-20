import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Calendar,
    Filter,
    Download,
    Package,
    Users,
    Euro,
    Clock,
    Target,
    AlertTriangle,
    CheckCircle,
    MapPin,
    PieChart,
    Activity
} from 'lucide-react';
import { getOrderStats, getFranchiseOrders, getWarehouses } from '../services/api';

const OrderStatsView = ({ theme }) => {
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // États pour les filtres
    const [dateRange, setDateRange] = useState('month'); // week, month, quarter, year
    const [selectedWarehouse, setSelectedWarehouse] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    // Classes CSS pour thème
    const isDark = theme === 'dark';
    const bgClass = isDark ? 'bg-gray-900' : 'bg-gray-100';
    const textClass = isDark ? 'text-gray-200' : 'text-gray-800';
    const cardBgClass = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const inputBgClass = isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';

    // Fonction pour charger les données
    const loadData = async () => {
        try {
            setError(null);

            const filters = {
                period: dateRange,
                warehouse_id: selectedWarehouse !== 'all' ? selectedWarehouse : undefined
            };

            const [statsResponse, ordersResponse, warehousesResponse] = await Promise.all([
                getOrderStats(filters),
                getFranchiseOrders(filters),
                getWarehouses()
            ]);

            if (statsResponse?.success) {
                setStats(statsResponse.data);
            }

            if (ordersResponse?.success) {
                setOrders(Array.isArray(ordersResponse.data) ? ordersResponse.data : ordersResponse.data?.data || []);
            }

            if (warehousesResponse?.success) {
                setWarehouses(Array.isArray(warehousesResponse.data) ? warehousesResponse.data : warehousesResponse.data?.data || []);
            }

        } catch (err) {
            console.error('Erreur lors du chargement des statistiques:', err);
            setError('Erreur lors du chargement des données');
            // Valeurs par défaut en cas d'erreur
            setStats({
                total_orders: 0,
                total_revenue: 0,
                average_order_value: 0,
                completion_rate: 0,
                mandatory_compliance_rate: 0,
                by_status: {},
                by_warehouse: {},
                by_period: {},
                top_products: [],
                recent_trends: {}
            });
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

    // Calculs basés sur les données chargées
    const calculatedStats = React.useMemo(() => {
        if (!orders.length) return null;

        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total_ttc || 0), 0);
        const avgOrderValue = totalRevenue / totalOrders;

        const statusCounts = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        const warehouseCounts = orders.reduce((acc, order) => {
            const warehouse = order.warehouse_name || 'Inconnu';
            acc[warehouse] = (acc[warehouse] || 0) + 1;
            return acc;
        }, {});

        const completedOrders = orders.filter(o => o.status === 'delivered').length;
        const completionRate = (completedOrders / totalOrders) * 100;

        const mandatoryCompliant = orders.filter(o => o.mandatory_percentage >= 80).length;
        const complianceRate = (mandatoryCompliant / totalOrders) * 100;

        return {
            totalOrders,
            totalRevenue,
            avgOrderValue,
            completionRate,
            complianceRate,
            statusCounts,
            warehouseCounts
        };
    }, [orders]);

    // Chargement initial
    useEffect(() => {
        loadData();
    }, [dateRange, selectedWarehouse]);

    // Fonction pour obtenir le texte de la période
    const getPeriodText = (period) => {
        switch (period) {
            case 'week': return 'Cette semaine';
            case 'month': return 'Ce mois';
            case 'quarter': return 'Ce trimestre';
            case 'year': return 'Cette année';
            default: return 'Période sélectionnée';
        }
    };

    // Fonction pour formater les montants
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount || 0);
    };

    // Fonction pour formater les pourcentages
    const formatPercentage = (value) => {
        return `${(value || 0).toFixed(1)}%`;
    };

    // Composant de graphique simple (placeholder)
    const SimpleChart = ({ title, data, type = 'bar' }) => (
        <div className={`p-6 rounded-xl border ${cardBgClass}`}>
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <div className="space-y-3">
                {Object.entries(data || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">{key}</span>
                        <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${Math.min((value / Math.max(...Object.values(data || {}))) * 100, 100)}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium w-8">{value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className={`p-8 ${bgClass} ${textClass} min-h-screen flex items-center justify-center`}>
                <div className="flex items-center space-x-2">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span className="text-lg">Chargement des statistiques...</span>
                </div>
            </div>
        );
    }

    const displayStats = stats || calculatedStats;

    return (
        <div className={`p-8 space-y-6 ${bgClass} ${textClass} min-h-screen`}>
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center">
                        <BarChart3 className="w-8 h-8 mr-3 text-blue-500" />
                        Statistiques des Commandes
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Analytics et métriques de performance - {getPeriodText(dateRange)}
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
                    <div className="flex items-center space-x-2 text-red-800">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Erreur</span>
                    </div>
                    <p className="mt-1 text-red-700">{error}</p>
                </div>
            )}

            {/* Filtres */}
            {showFilters && (
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Période</label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="week">Cette semaine</option>
                                <option value="month">Ce mois</option>
                                <option value="quarter">Ce trimestre</option>
                                <option value="year">Cette année</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Entrepôt</label>
                            <select
                                value={selectedWarehouse}
                                onChange={(e) => setSelectedWarehouse(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="all">Tous les entrepôts</option>
                                {warehouses.map(warehouse => (
                                    <option key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setDateRange('month');
                                    setSelectedWarehouse('all');
                                }}
                                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Commandes</p>
                            <p className="text-2xl font-bold text-blue-500">
                                {displayStats?.totalOrders || stats?.total_orders || 0}
                            </p>
                        </div>
                        <Package className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Chiffre d'Affaires</p>
                            <p className="text-2xl font-bold text-green-500">
                                {formatCurrency(displayStats?.totalRevenue || stats?.total_revenue)}
                            </p>
                        </div>
                        <Euro className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Panier Moyen</p>
                            <p className="text-2xl font-bold text-purple-500">
                                {formatCurrency(displayStats?.avgOrderValue || stats?.average_order_value)}
                            </p>
                        </div>
                        <Activity className="w-8 h-8 text-purple-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Taux de Livraison</p>
                            <p className="text-2xl font-bold text-orange-500">
                                {formatPercentage(displayStats?.completionRate || stats?.completion_rate)}
                            </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-orange-500" />
                    </div>
                </div>
            </div>

            {/* Métriques secondaires */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Conformité 80/20</h3>
                        <Target className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-yellow-500">
                            {formatPercentage(displayStats?.complianceRate || stats?.mandatory_compliance_rate)}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            des commandes respectent le ratio obligatoire
                        </p>
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Temps Moyen</h3>
                        <Clock className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-blue-500">
                            {stats?.average_preparation_time || '2h 15min'}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            de la confirmation à la livraison
                        </p>
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Franchisés Actifs</h3>
                        <Users className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-green-500">
                            {stats?.active_franchisees || new Set(orders.map(o => o.user_id)).size}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            ont passé des commandes
                        </p>
                    </div>
                </div>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SimpleChart
                    title="Répartition par Statut"
                    data={displayStats?.statusCounts || stats?.by_status}
                />

                <SimpleChart
                    title="Répartition par Entrepôt"
                    data={displayStats?.warehouseCounts || stats?.by_warehouse}
                />
            </div>

            {/* Produits les plus commandés */}
            {(stats?.top_products?.length > 0) && (
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <h3 className="text-lg font-semibold mb-4">Produits les Plus Commandés</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.top_products.slice(0, 6).map((product, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div>
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-sm text-gray-500">{product.quantity} unités</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">{formatCurrency(product.revenue)}</p>
                                    <p className="text-xs text-gray-500">#{index + 1}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Message si pas de données */}
            {!displayStats && !loading && (
                <div className={`p-12 text-center rounded-xl border ${cardBgClass}`}>
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                    <h3 className="text-xl font-medium mb-2">Aucune donnée disponible</h3>
                    <p className="text-gray-500">
                        Aucune commande trouvée pour la période sélectionnée.
                    </p>
                </div>
            )}
        </div>
    );
};

export default OrderStatsView;