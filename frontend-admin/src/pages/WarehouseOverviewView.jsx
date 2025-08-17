// frontend-admin/src/pages/WarehouseOverviewView.jsx
import React, { useState, useEffect } from 'react';
import {
    Package,
    Warehouse,
    TrendingUp,
    AlertTriangle,
    MapPin,
    Calendar,
    RefreshCw,
    Plus,
    Eye,
    Edit,
    Activity,
    DollarSign
} from 'lucide-react';
import {
    getWarehouses,
    getStockAlerts,
    getStockValuation,
    getWarehouseStocks
} from '../services/api.js';

/**
 * Composant Vue d'ensemble des entrepôts
 * @param {object} props - Propriétés du composant
 * @param {string} props.theme - Thème actuel (dark/light)
 */
const WarehouseOverviewView = ({ theme }) => {
    // États du composant
    const [warehouses, setWarehouses] = useState([]);
    const [stockAlerts, setStockAlerts] = useState([]);
    const [stockValuation, setStockValuation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Classes CSS conditionnelles selon le thème
    const bgClass = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';
    const textClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    const cardBgClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const hoverBgClass = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

    // Fonction pour charger toutes les données
    const loadData = async () => {
        try {
            setError(null);

            // Chargement en parallèle de toutes les données
            const [warehousesData, alertsData, valuationData] = await Promise.all([
                getWarehouses({ with_stats: true }),
                getStockAlerts(),
                getStockValuation()
            ]);

            setWarehouses(warehousesData.data || warehousesData);
            setStockAlerts(alertsData.data || alertsData);
            setStockValuation(valuationData.data || valuationData);

        } catch (err) {
            console.error('Erreur lors du chargement des données:', err);
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

    // Chargement initial des données
    useEffect(() => {
        loadData();
    }, []);

    // Calcul des métriques globales
    const globalMetrics = React.useMemo(() => {
        if (!warehouses.length || !stockValuation) {
            return {
                totalValue: 0,
                totalAlerts: 0,
                totalProducts: 0,
                activeWarehouses: 0
            };
        }

        return {
            totalValue: stockValuation.total_value || 0,
            totalAlerts: stockAlerts.length || 0,
            totalProducts: stockValuation.total_products || 0,
            activeWarehouses: warehouses.filter(w => w.status === 'active').length
        };
    }, [warehouses, stockAlerts, stockValuation]);

    // Fonction pour obtenir le statut coloré
    const getStatusBadge = (status) => {
        const statusColors = {
            active: 'bg-green-100 text-green-800',
            maintenance: 'bg-orange-100 text-orange-800',
            inactive: 'bg-red-100 text-red-800'
        };

        const statusTexts = {
            active: 'Opérationnel',
            maintenance: 'Maintenance',
            inactive: 'Inactif'
        };

        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || statusColors.inactive}`}>
                {statusTexts[status] || status}
            </span>
        );
    };

    // Fonction pour formater les montants
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    // Fonction pour formater les dates
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
                    <span className="text-lg">Chargement des entrepôts...</span>
                </div>
            </div>
        );
    }

    // Affichage d'erreur
    if (error) {
        return (
            <div className={`p-8 ${bgClass} ${textClass} min-h-screen`}>
                <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center space-x-2 text-red-800">
                        <AlertTriangle className="w-5 h-5" />
                        <h3 className="font-medium">Erreur de chargement</h3>
                    </div>
                    <p className="mt-2 text-red-700">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-8 space-y-6 ${bgClass} ${textClass} min-h-screen`}>
            {/* En-tête avec actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Vue d'ensemble des Entrepôts</h1>
                    <p className="text-gray-500 mt-1">
                        Gestion et surveillance des 4 entrepôts d'Île-de-France
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Actualiser
                    </button>
                    <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Eye className="w-4 h-4 mr-2" />
                        Rapport complet
                    </button>
                    <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau stock
                    </button>
                </div>
            </div>

            {/* Métriques globales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Valeur totale stocks</p>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(globalMetrics.totalValue)}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Alertes stock faible</p>
                            <p className={`text-2xl font-bold ${globalMetrics.totalAlerts > 5 ? 'text-red-500' : 'text-orange-500'}`}>
                                {globalMetrics.totalAlerts}
                            </p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Produits gérés</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {globalMetrics.totalProducts}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Entrepôts actifs</p>
                            <p className={`text-2xl font-bold ${globalMetrics.activeWarehouses === warehouses.length ? 'text-green-500' : 'text-orange-500'}`}>
                                {globalMetrics.activeWarehouses}/{warehouses.length}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <Warehouse className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Liste des entrepôts */}
            <div className={`rounded-xl border ${cardBgClass} overflow-hidden`}>
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold">Détail par entrepôt</h2>
                </div>

                {warehouses.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Warehouse className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Aucun entrepôt trouvé</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700">
                        {warehouses.map((warehouse) => (
                            <div key={warehouse.id} className={`p-6 transition-colors ${hoverBgClass}`}>
                                <div className="flex items-center justify-between">
                                    {/* Informations de base */}
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-blue-100 rounded-full">
                                            <MapPin className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">{warehouse.name}</h3>
                                            <p className="text-gray-400">{warehouse.address}</p>
                                            <p className="text-sm text-gray-500">
                                                📧 {warehouse.email} • 📞 {warehouse.phone}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Métriques de l'entrepôt */}
                                    <div className="flex items-center space-x-8">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-400">Valeur stock</p>
                                            <p className="text-lg font-semibold">
                                                {formatCurrency(warehouse.stock_value || 0)}
                                            </p>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-sm text-gray-400">Alertes</p>
                                            <p className={`text-lg font-semibold ${
                                                (warehouse.low_stock_count || 0) > 3 ? 'text-red-500' : 'text-orange-500'
                                            }`}>
                                                {warehouse.low_stock_count || 0}
                                            </p>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-sm text-gray-400">Produits</p>
                                            <p className="text-lg font-semibold">
                                                {warehouse.total_products || 0}
                                            </p>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-sm text-gray-400">Statut</p>
                                            {getStatusBadge(warehouse.status)}
                                        </div>

                                        <div className="text-center">
                                            <p className="text-sm text-gray-400">Dernière MAJ</p>
                                            <p className="text-sm">
                                                {warehouse.updated_at ? formatDate(warehouse.updated_at) : 'N/A'}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex space-x-2">
                                            <button className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                                <Eye className="w-4 h-4 mr-1" />
                                                Voir
                                            </button>
                                            <button className="flex items-center px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                                                <Edit className="w-4 h-4 mr-1" />
                                                Gérer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Section des alertes récentes si il y en a */}
            {stockAlerts.length > 0 && (
                <div className={`rounded-xl border ${cardBgClass} overflow-hidden`}>
                    <div className="p-6 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center">
                                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                                Alertes de stock ({stockAlerts.length})
                            </h2>
                            <button className="text-blue-400 hover:text-blue-300 text-sm">
                                Voir toutes les alertes →
                            </button>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-3">
                            {stockAlerts.slice(0, 5).map((alert, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                                        <div>
                                            <p className="font-medium text-orange-800">
                                                {alert.product_name} - {alert.warehouse_name}
                                            </p>
                                            <p className="text-sm text-orange-600">
                                                Stock actuel: {alert.current_stock} • Minimum: {alert.minimum_stock}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors">
                                        Réapprovisionner
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarehouseOverviewView;