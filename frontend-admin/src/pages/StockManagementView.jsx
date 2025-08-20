// frontend-admin/src/pages/StockManagementView.jsx
import React, { useState, useEffect } from 'react';
import {
    Package,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Filter,
    Search,
    Plus,
    Minus,
    ArrowRightLeft,
    Edit,
    AlertTriangle,
    CheckCircle,
    Clock,
    MapPin,
    Eye,
    Download,
    Upload,
    Settings,
    History,
    Calculator
} from 'lucide-react';
import {
    getWarehouseStocks,
    getWarehouses,
    adjustStock,
    stockIn,
    stockOut,
    transferStock,
    getStockAlerts
} from '../services/api.js';

/**
 * Composant pour la gestion détaillée des stocks
 * @param {object} props - Propriétés du composant
 * @param {string} props.theme - Thème actuel (dark/light)
 */
const StockManagementView = ({ theme }) => {
    // États du composant
    const [stocks, setStocks] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // États des filtres
    const [filters, setFilters] = useState({
        warehouse_id: '',
        search: '',
        category: '',
        alert_level: '', // low_stock, out_of_stock, excess_stock
        sort_by: 'product_name',
        sort_direction: 'asc'
    });
    const [showFilters, setShowFilters] = useState(false);

    // États pour les modals
    const [selectedStock, setSelectedStock] = useState(null);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showStockInModal, setShowStockInModal] = useState(false);
    const [showStockOutModal, setShowStockOutModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // États pour les actions
    const [processingStocks, setProcessingStocks] = useState(new Set());

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
                per_page: 50,
                include: 'product,warehouse',
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value !== '')
                )
            };

            // Chargement en parallèle
            const [stocksData, warehousesData, alertsData] = await Promise.all([
                getWarehouseStocks(null, apiFilters),
                getWarehouses().catch(() => ({ data: [] })),
                getStockAlerts().catch(() => ({ data: [] }))
            ]);

            setStocks(Array.isArray(stocksData.data) ? stocksData.data : []);
            setTotalPages(stocksData.last_page || 1);
            setWarehouses(Array.isArray(warehousesData.data) ? warehousesData.data : []);
            setAlerts(Array.isArray(alertsData.data) ? alertsData.data : []);

        } catch (err) {
            console.error('Erreur lors du chargement des stocks:', err);
            setError(err.message);
            setStocks([]);
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
            category: '',
            alert_level: '',
            sort_by: 'product_name',
            sort_direction: 'asc'
        });
        setCurrentPage(1);
    };

    // Actions sur les stocks
    const handleStockAction = async (action, stockId, data) => {
        if (processingStocks.has(stockId)) return;

        setProcessingStocks(prev => new Set(prev).add(stockId));
        try {
            switch (action) {
                case 'adjust':
                    await adjustStock(data);
                    break;
                case 'stock_in':
                    await stockIn(data);
                    break;
                case 'stock_out':
                    await stockOut(data);
                    break;
                case 'transfer':
                    await transferStock(data);
                    break;
                default:
                    throw new Error('Action inconnue');
            }

            await loadData(); // Recharger les données

            // Fermer les modals
            setShowAdjustModal(false);
            setShowTransferModal(false);
            setShowStockInModal(false);
            setShowStockOutModal(false);
            setSelectedStock(null);

        } catch (err) {
            setError(err.message);
        } finally {
            setProcessingStocks(prev => {
                const newSet = new Set(prev);
                newSet.delete(stockId);
                return newSet;
            });
        }
    };

    // Chargement initial
    useEffect(() => {
        loadData();
    }, [currentPage]);

    // Fonctions utilitaires
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const getStockStatus = (stock) => {
        const current = stock.current_stock || 0;
        const min = stock.minimum_stock || 0;
        const max = stock.maximum_stock || 999999;

        if (current === 0) return { level: 'out', text: 'Rupture', color: 'text-red-500', bg: 'bg-red-100' };
        if (current <= min) return { level: 'low', text: 'Stock faible', color: 'text-orange-500', bg: 'bg-orange-100' };
        if (current >= max) return { level: 'excess', text: 'Stock excessif', color: 'text-purple-500', bg: 'bg-purple-100' };
        return { level: 'normal', text: 'Normal', color: 'text-green-500', bg: 'bg-green-100' };
    };

    const getAvailabilityPercentage = (stock) => {
        const available = (stock.current_stock || 0) - (stock.reserved_stock || 0);
        const total = stock.current_stock || 0;
        return total > 0 ? Math.round((available / total) * 100) : 0;
    };

    // Statistiques globales
    const globalStats = React.useMemo(() => {
        const stocksArray = Array.isArray(stocks) ? stocks : [];

        return {
            totalProducts: stocksArray.length,
            totalValue: stocksArray.reduce((sum, s) => sum + ((s.current_stock || 0) * (s.product?.cost_price || 0)), 0),
            lowStockCount: stocksArray.filter(s => {
                const status = getStockStatus(s);
                return status.level === 'low' || status.level === 'out';
            }).length,
            totalItems: stocksArray.reduce((sum, s) => sum + (s.current_stock || 0), 0)
        };
    }, [stocks]);

    // Affichage du loading
    if (loading) {
        return (
            <div className={`p-8 ${bgClass} ${textClass} min-h-screen flex items-center justify-center`}>
                <div className="flex items-center space-x-2">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span className="text-lg">Chargement de la gestion des stocks...</span>
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
                        <Package className="w-8 h-8 mr-3 text-blue-500" />
                        Gestion des Stocks
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Contrôle et optimisation des stocks en temps réel
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
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                    </button>
                    <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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

            {/* Statistiques globales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Produits en stock</p>
                            <p className="text-2xl font-bold text-blue-500">{globalStats.totalProducts}</p>
                        </div>
                        <Package className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Valeur totale</p>
                            <p className="text-2xl font-bold text-green-500">
                                {formatCurrency(globalStats.totalValue)}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Alertes stocks</p>
                            <p className={`text-2xl font-bold ${
                                globalStats.lowStockCount > 0 ? 'text-red-500' : 'text-green-500'
                            }`}>
                                {globalStats.lowStockCount}
                            </p>
                        </div>
                        <AlertTriangle className={`w-8 h-8 ${
                            globalStats.lowStockCount > 0 ? 'text-red-500' : 'text-green-500'
                        }`} />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Articles totaux</p>
                            <p className="text-2xl font-bold text-purple-500">
                                {globalStats.totalItems.toLocaleString()}
                            </p>
                        </div>
                        <Calculator className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Filtres */}
            {showFilters && (
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
                            <label className="block text-sm font-medium mb-2">Niveau d'alerte</label>
                            <select
                                value={filters.alert_level}
                                onChange={(e) => handleFilterChange('alert_level', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="">Tous les niveaux</option>
                                <option value="out_of_stock">Rupture de stock</option>
                                <option value="low_stock">Stock faible</option>
                                <option value="excess_stock">Stock excessif</option>
                                <option value="normal">Normal</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Catégorie</label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="">Toutes les catégories</option>
                                <option value="ingredients">Ingrédients</option>
                                <option value="prepared_dishes">Plats préparés</option>
                                <option value="beverages">Boissons</option>
                                <option value="desserts">Desserts</option>
                                <option value="packaging">Emballages</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Trier par</label>
                            <select
                                value={filters.sort_by}
                                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="product_name">Nom du produit</option>
                                <option value="current_stock">Stock actuel</option>
                                <option value="warehouse_name">Entrepôt</option>
                                <option value="last_movement">Dernier mouvement</option>
                                <option value="stock_value">Valeur du stock</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Ordre</label>
                            <select
                                value={filters.sort_direction}
                                onChange={(e) => handleFilterChange('sort_direction', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="asc">Croissant</option>
                                <option value="desc">Décroissant</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Recherche</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Nom du produit..."
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

            {/* Alertes rapides */}
            {alerts.length > 0 && (
                <div className={`rounded-xl border border-orange-300 ${cardBgClass} overflow-hidden`}>
                    <div className="p-4 bg-orange-50 border-b border-orange-200">
                        <h3 className="text-lg font-semibold text-orange-800 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            Alertes de stock ({alerts.length})
                        </h3>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {alerts.slice(0, 6).map((alert, index) => (
                                <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-orange-800">
                                                {alert.product_name}
                                            </p>
                                            <p className="text-sm text-orange-600">
                                                {alert.warehouse_name} • Stock: {alert.current_stock}
                                            </p>
                                        </div>
                                        <button className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors">
                                            Action
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {alerts.length > 6 && (
                            <div className="mt-4 text-center">
                                <button className="text-orange-600 hover:text-orange-800 text-sm">
                                    Voir toutes les alertes ({alerts.length - 6} de plus)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Liste des stocks */}
            <div className={`rounded-xl border ${cardBgClass} overflow-hidden`}>
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold">
                        Gestion des stocks ({stocks.length} produits)
                    </h2>
                </div>

                {stocks.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-medium mb-2">Aucun stock trouvé</h3>
                        <p>Aucun produit ne correspond aux critères sélectionnés.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}>
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                                    Produit
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                                    Entrepôt
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider">
                                    Stock actuel
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider">
                                    Disponible
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider">
                                    Seuils
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider">
                                    Valeur
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider">
                                    Statut
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                            {stocks.map((stock) => {
                                const status = getStockStatus(stock);
                                const availability = getAvailabilityPercentage(stock);
                                const isProcessing = processingStocks.has(stock.id);
                                const stockValue = (stock.current_stock || 0) * (stock.product?.cost_price || 0);

                                return (
                                    <tr key={stock.id} className={`transition-colors ${hoverBgClass}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium">
                                                    {stock.product?.name || 'Produit inconnu'}
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    {stock.product?.sku || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                                <span className="text-sm">
                                                        {stock.warehouse?.name || 'Entrepôt inconnu'}
                                                    </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div>
                                                <div className="text-lg font-semibold">
                                                    {stock.current_stock || 0}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Réservé: {stock.reserved_stock || 0}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div>
                                                <div className="text-sm font-medium">
                                                    {(stock.current_stock || 0) - (stock.reserved_stock || 0)}
                                                </div>
                                                <div className={`text-xs ${
                                                    availability >= 80 ? 'text-green-500' :
                                                        availability >= 50 ? 'text-orange-500' : 'text-red-500'
                                                }`}>
                                                    {availability}% dispo
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                            <div>
                                                <div>Min: {stock.minimum_stock || 0}</div>
                                                <div>Max: {stock.maximum_stock || 'N/A'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="text-sm font-medium">
                                                {formatCurrency(stockValue)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.bg} ${status.color}`}>
                                                    {status.text}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedStock(stock);
                                                        setShowTransferModal(true);
                                                    }}
                                                    disabled={isProcessing || (stock.current_stock || 0) === 0}
                                                    className="p-1 text-purple-600 hover:text-purple-800 transition-colors disabled:opacity-50"
                                                    title="Transfert"
                                                >
                                                    <ArrowRightLeft className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setSelectedStock(stock);
                                                        setShowHistoryModal(true);
                                                    }}
                                                    className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                                                    title="Historique"
                                                >
                                                    <History className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
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

            {/* Modals */}
            {showAdjustModal && selectedStock && (
                <AdjustStockModal
                    stock={selectedStock}
                    isOpen={showAdjustModal}
                    onClose={() => {
                        setShowAdjustModal(false);
                        setSelectedStock(null);
                    }}
                    onSubmit={(data) => handleStockAction('adjust', selectedStock.id, data)}
                    theme={theme}
                />
            )}

            {showStockInModal && selectedStock && (
                <StockInModal
                    stock={selectedStock}
                    isOpen={showStockInModal}
                    onClose={() => {
                        setShowStockInModal(false);
                        setSelectedStock(null);
                    }}
                    onSubmit={(data) => handleStockAction('stock_in', selectedStock.id, data)}
                    theme={theme}
                />
            )}

            {showStockOutModal && selectedStock && (
                <StockOutModal
                    stock={selectedStock}
                    isOpen={showStockOutModal}
                    onClose={() => {
                        setShowStockOutModal(false);
                        setSelectedStock(null);
                    }}
                    onSubmit={(data) => handleStockAction('stock_out', selectedStock.id, data)}
                    theme={theme}
                />
            )}

            {showTransferModal && selectedStock && (
                <TransferStockModal
                    stock={selectedStock}
                    warehouses={warehouses}
                    isOpen={showTransferModal}
                    onClose={() => {
                        setShowTransferModal(false);
                        setSelectedStock(null);
                    }}
                    onSubmit={(data) => handleStockAction('transfer', selectedStock.id, data)}
                    theme={theme}
                />
            )}

            {showHistoryModal && selectedStock && (
                <StockHistoryModal
                    stock={selectedStock}
                    isOpen={showHistoryModal}
                    onClose={() => {
                        setShowHistoryModal(false);
                        setSelectedStock(null);
                    }}
                    theme={theme}
                />
            )}
        </div>
    );
};

/**
 * Modal pour ajuster le stock
 */
const AdjustStockModal = ({ stock, isOpen, onClose, onSubmit, theme }) => {
    const [formData, setFormData] = useState({
        new_quantity: stock.current_stock || 0,
        reason: ''
    });

    const modalBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const textClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    const inputBgClass = theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            warehouse_id: stock.warehouse_id,
            product_id: stock.product_id,
            ...formData
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className={`max-w-md w-full rounded-xl ${modalBgClass} ${textClass}`}>
                <div className="p-6 border-b border-gray-700">
                    <h3 className="text-lg font-semibold flex items-center">
                        <Edit className="w-5 h-5 mr-2" />
                        Ajuster le stock
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {stock.product?.name} - {stock.warehouse?.name}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Stock actuel</label>
                        <div className="text-lg font-semibold text-blue-500">
                            {stock.current_stock || 0} unités
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Nouvelle quantité</label>
                        <input
                            type="number"
                            min="0"
                            value={formData.new_quantity}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                new_quantity: parseInt(e.target.value) || 0
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Raison de l'ajustement</label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                reason: e.target.value
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            rows="3"
                            placeholder="Décrivez la raison de cet ajustement..."
                            required
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Ajuster
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/**
 * Modal pour entrée de stock
 */
const StockInModal = ({ stock, isOpen, onClose, onSubmit, theme }) => {
    const [formData, setFormData] = useState({
        quantity: '',
        reason: 'Réapprovisionnement',
        reference: ''
    });

    const modalBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const textClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    const inputBgClass = theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            warehouse_id: stock.warehouse_id,
            product_id: stock.product_id,
            ...formData,
            quantity: parseInt(formData.quantity)
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className={`max-w-md w-full rounded-xl ${modalBgClass} ${textClass}`}>
                <div className="p-6 border-b border-gray-700">
                    <h3 className="text-lg font-semibold flex items-center">
                        <Plus className="w-5 h-5 mr-2 text-green-500" />
                        Entrée de stock
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {stock.product?.name} - {stock.warehouse?.name}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Stock actuel</label>
                        <div className="text-lg font-semibold text-blue-500">
                            {stock.current_stock || 0} unités
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Quantité à ajouter</label>
                        <input
                            type="number"
                            min="1"
                            value={formData.quantity}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                quantity: e.target.value
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            placeholder="Nombre d'unités à ajouter"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Raison</label>
                        <select
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                reason: e.target.value
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                        >
                            <option value="Réapprovisionnement">Réapprovisionnement</option>
                            <option value="Retour fournisseur">Retour fournisseur</option>
                            <option value="Production interne">Production interne</option>
                            <option value="Correction d'inventaire">Correction d'inventaire</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Référence (optionnel)</label>
                        <input
                            type="text"
                            value={formData.reference}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                reference: e.target.value
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            placeholder="N° bon de livraison, facture..."
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Ajouter
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/**
 * Modal pour sortie de stock
 */
const StockOutModal = ({ stock, isOpen, onClose, onSubmit, theme }) => {
    const [formData, setFormData] = useState({
        quantity: '',
        reason: 'Consommation interne'
    });

    const modalBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const textClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    const inputBgClass = theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            warehouse_id: stock.warehouse_id,
            product_id: stock.product_id,
            ...formData,
            quantity: parseInt(formData.quantity)
        });
    };

    const maxQuantity = (stock.current_stock || 0) - (stock.reserved_stock || 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className={`max-w-md w-full rounded-xl ${modalBgClass} ${textClass}`}>
                <div className="p-6 border-b border-gray-700">
                    <h3 className="text-lg font-semibold flex items-center">
                        <Minus className="w-5 h-5 mr-2 text-red-500" />
                        Sortie de stock
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {stock.product?.name} - {stock.warehouse?.name}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Stock disponible</label>
                        <div className="text-lg font-semibold text-blue-500">
                            {maxQuantity} unités
                        </div>
                        <div className="text-sm text-gray-500">
                            (Total: {stock.current_stock || 0} - Réservé: {stock.reserved_stock || 0})
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Quantité à retirer</label>
                        <input
                            type="number"
                            min="1"
                            max={maxQuantity}
                            value={formData.quantity}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                quantity: e.target.value
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            placeholder={`Maximum: ${maxQuantity}`}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Raison</label>
                        <select
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                reason: e.target.value
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                        >
                            <option value="Consommation interne">Consommation interne</option>
                            <option value="Produit défectueux">Produit défectueux</option>
                            <option value="Péremption">Péremption</option>
                            <option value="Test qualité">Test qualité</option>
                            <option value="Perte">Perte</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Retirer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/**
 * Modal pour transfert de stock
 */
const TransferStockModal = ({ stock, warehouses, isOpen, onClose, onSubmit, theme }) => {
    const [formData, setFormData] = useState({
        to_warehouse_id: '',
        quantity: '',
        reason: 'Rééquilibrage des stocks'
    });

    const modalBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const textClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    const inputBgClass = theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            from_warehouse_id: stock.warehouse_id,
            product_id: stock.product_id,
            ...formData,
            quantity: parseInt(formData.quantity)
        });
    };

    const maxQuantity = (stock.current_stock || 0) - (stock.reserved_stock || 0);
    const availableWarehouses = warehouses.filter(w => w.id !== stock.warehouse_id);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className={`max-w-md w-full rounded-xl ${modalBgClass} ${textClass}`}>
                <div className="p-6 border-b border-gray-700">
                    <h3 className="text-lg font-semibold flex items-center">
                        <ArrowRightLeft className="w-5 h-5 mr-2 text-purple-500" />
                        Transfert de stock
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {stock.product?.name} depuis {stock.warehouse?.name}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Stock disponible</label>
                        <div className="text-lg font-semibold text-blue-500">
                            {maxQuantity} unités
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Entrepôt de destination</label>
                        <select
                            value={formData.to_warehouse_id}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                to_warehouse_id: e.target.value
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            required
                        >
                            <option value="">Sélectionner un entrepôt</option>
                            {availableWarehouses.map(warehouse => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Quantité à transférer</label>
                        <input
                            type="number"
                            min="1"
                            max={maxQuantity}
                            value={formData.quantity}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                quantity: e.target.value
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            placeholder={`Maximum: ${maxQuantity}`}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Raison du transfert</label>
                        <input
                            type="text"
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                reason: e.target.value
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            placeholder="Décrivez la raison du transfert"
                            required
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Transférer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/**
 * Modal pour l'historique des mouvements de stock
 */
const StockHistoryModal = ({ stock, isOpen, onClose, theme }) => {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);

    const modalBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const textClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';

    useEffect(() => {
        if (isOpen && stock) {
            // Simuler le chargement de l'historique
            // Dans une vraie app, vous feriez un appel API ici
            setTimeout(() => {
                setMovements([
                    {
                        id: 1,
                        type: 'stock_in',
                        quantity: 50,
                        reason: 'Réapprovisionnement',
                        user: 'Admin',
                        created_at: '2025-08-17 10:30:00'
                    },
                    {
                        id: 2,
                        type: 'order_delivery',
                        quantity: -15,
                        reason: 'Commande DC-2025-001',
                        user: 'Système',
                        created_at: '2025-08-16 15:20:00'
                    },
                    {
                        id: 3,
                        type: 'adjustment',
                        quantity: -2,
                        reason: 'Correction inventaire',
                        user: 'Admin',
                        created_at: '2025-08-15 09:45:00'
                    }
                ]);
                setLoading(false);
            }, 1000);
        }
    }, [isOpen, stock]);

    const formatDate = (dateString) => {
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    };

    const getMovementIcon = (type) => {
        switch (type) {
            case 'stock_in': return <Plus className="w-4 h-4 text-green-500" />;
            case 'stock_out': return <Minus className="w-4 h-4 text-red-500" />;
            case 'transfer_in': return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
            case 'transfer_out': return <ArrowRightLeft className="w-4 h-4 text-orange-500" />;
            case 'order_delivery': return <Package className="w-4 h-4 text-purple-500" />;
            case 'adjustment': return <Edit className="w-4 h-4 text-yellow-500" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className={`max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-xl ${modalBgClass} ${textClass}`}>
                <div className="p-6 border-b border-gray-700">
                    <h3 className="text-lg font-semibold flex items-center">
                        <History className="w-5 h-5 mr-2" />
                        Historique des mouvements
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {stock.product?.name} - {stock.warehouse?.name}
                    </p>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                            <p>Chargement de l'historique...</p>
                        </div>
                    ) : movements.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucun mouvement trouvé</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {movements.map((movement) => (
                                <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        {getMovementIcon(movement.type)}
                                        <div>
                                            <p className="font-medium">
                                                {movement.quantity > 0 ? '+' : ''}{movement.quantity} unités
                                            </p>
                                            <p className="text-sm text-gray-500">{movement.reason}</p>
                                            <p className="text-xs text-gray-400">Par {movement.user}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">
                                            {formatDate(movement.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockManagementView;