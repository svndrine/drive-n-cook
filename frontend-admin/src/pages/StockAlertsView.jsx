// frontend-admin/src/pages/StockAlertsView.jsx
import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    RefreshCw,
    Filter,
    Search,
    Package,
    TrendingDown,
    TrendingUp,
    Clock,
    MapPin,
    Settings,
    Download,
    CheckCircle,
    X,
    Plus,
    ArrowRightLeft,
    Bell,
    BellOff,
    Calendar,
    Eye
} from 'lucide-react';

// Import des fonctions API
import {
    getStockAlerts,
    getWarehouses,
    adjustStock,
    stockIn,
    transferStock,
    resolveStockAlert,
    dismissStockAlert
} from '../services/api.js';

/**
 * Composant pour la gestion des alertes de stock
 */
const StockAlertsView = ({ theme }) => {
    // États du composant
    const [alerts, setAlerts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // États des filtres
    const [filters, setFilters] = useState({
        warehouse_id: '',
        alert_type: '',
        search: '',
        severity: '',
        status: 'active' // Par défaut, montrer seulement les alertes actives
    });
    const [showFilters, setShowFilters] = useState(false);

    // États pour les modals
    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [actionType, setActionType] = useState('');

    // États pour les actions
    const [processingAlerts, setProcessingAlerts] = useState(new Set());
    const [selectedAlertIds, setSelectedAlertIds] = useState(new Set());

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

            // Préparer les paramètres pour l'API
            const params = { ...filters };

            // Supprimer les paramètres vides
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            console.log('Chargement des alertes avec filtres:', params);

            // Charger les alertes et entrepôts en parallèle
            const [alertsResponse, warehousesResponse] = await Promise.all([
                getStockAlerts(params),
                getWarehouses({ active: true })
            ]);

            console.log('Alertes reçues:', alertsResponse);
            console.log('Entrepôts reçus:', warehousesResponse);

            // Gérer la réponse des alertes
            if (alertsResponse.success) {
                const alertsData = alertsResponse.data;
                setAlerts(Array.isArray(alertsData) ? alertsData : []);
            } else {
                setAlerts([]);
                setError(alertsResponse.message || 'Erreur lors du chargement des alertes');
            }

            // Gérer la réponse des entrepôts
            if (warehousesResponse.success) {
                const warehousesData = warehousesResponse.data;
                setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
            } else {
                setWarehouses([]);
            }

        } catch (err) {
            console.error('Erreur lors du chargement des alertes:', err);
            setError(err.message || 'Erreur de connexion au serveur');
            setAlerts([]);
            setWarehouses([]);
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
    };

    // Application des filtres
    const applyFilters = () => {
        loadData();
    };

    // Reset des filtres
    const resetFilters = () => {
        setFilters({
            warehouse_id: '',
            alert_type: '',
            search: '',
            severity: '',
            status: 'active'
        });
    };

    // Actions sur les alertes
    const handleResolveAlert = async (alertId, actionData) => {
        if (processingAlerts.has(alertId)) return;

        setProcessingAlerts(prev => new Set(prev).add(alertId));
        try {
            let response;

            // Effectuer l'action selon le type
            if (actionType === 'restock') {
                const alert = alerts.find(a => a.id === alertId);
                if (!alert) return;

                // Faire un réapprovisionnement
                response = await stockIn({
                    warehouse_id: alert.warehouse_id,
                    product_id: alert.product_id,
                    quantity: actionData.quantity,
                    reason: actionData.reason || 'Réapprovisionnement suite à alerte'
                });
            } else if (actionType === 'transfer') {
                const alert = alerts.find(a => a.id === alertId);
                if (!alert) return;

                // Faire un transfert
                response = await transferStock({
                    from_warehouse_id: alert.warehouse_id,
                    to_warehouse_id: actionData.targetWarehouse,
                    product_id: alert.product_id,
                    quantity: actionData.quantity,
                    reason: actionData.reason || 'Transfert suite à alerte stock excessif'
                });
            }

            if (response && response.success) {
                // Marquer l'alerte comme résolue
                await resolveStockAlert(alertId, 'Action automatique effectuée');
                await loadData();
                setShowActionModal(false);
                setSelectedAlert(null);
            } else {
                setError(response?.message || 'Erreur lors de l\'action');
            }
        } catch (err) {
            console.error('Erreur lors de la résolution:', err);
            setError(err.message || 'Erreur lors de l\'action');
        } finally {
            setProcessingAlerts(prev => {
                const newSet = new Set(prev);
                newSet.delete(alertId);
                return newSet;
            });
        }
    };

    const handleDismissAlert = async (alertId) => {
        if (processingAlerts.has(alertId)) return;
        if (!confirm('Êtes-vous sûr de vouloir ignorer cette alerte ?')) return;

        setProcessingAlerts(prev => new Set(prev).add(alertId));
        try {
            const response = await dismissStockAlert(alertId, 'Ignorée par l\'administrateur');
            if (response.success) {
                await loadData();
            } else {
                setError(response.message || 'Erreur lors de l\'action');
            }
        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            setError(err.message || 'Erreur lors de l\'action');
        } finally {
            setProcessingAlerts(prev => {
                const newSet = new Set(prev);
                newSet.delete(alertId);
                return newSet;
            });
        }
    };

    // Actions en lot
    const handleBulkResolve = async () => {
        if (selectedAlertIds.size === 0) return;
        if (!confirm(`Résoudre ${selectedAlertIds.size} alerte(s) ?`)) return;

        for (const alertId of selectedAlertIds) {
            try {
                await resolveStockAlert(alertId, 'Résolution en lot');
            } catch (err) {
                console.error(`Erreur lors de la résolution de l'alerte ${alertId}:`, err);
            }
        }

        setSelectedAlertIds(new Set());
        await loadData();
    };

    const handleBulkDismiss = async () => {
        if (selectedAlertIds.size === 0) return;
        if (!confirm(`Ignorer ${selectedAlertIds.size} alerte(s) ?`)) return;

        for (const alertId of selectedAlertIds) {
            try {
                await dismissStockAlert(alertId, 'Ignorée en lot');
            } catch (err) {
                console.error(`Erreur lors de la suppression de l'alerte ${alertId}:`, err);
            }
        }

        setSelectedAlertIds(new Set());
        await loadData();
    };

    // Sélection multiple
    const handleSelectAll = () => {
        if (selectedAlertIds.size === alerts.length) {
            setSelectedAlertIds(new Set());
        } else {
            setSelectedAlertIds(new Set(alerts.map(a => a.id)));
        }
    };

    const handleSelectAlert = (alertId) => {
        setSelectedAlertIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(alertId)) {
                newSet.delete(alertId);
            } else {
                newSet.add(alertId);
            }
            return newSet;
        });
    };

    // Chargement initial
    useEffect(() => {
        loadData();
    }, []);

    // Recharger quand les filtres changent (avec délai)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (!loading) {
                loadData();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [filters]);

    // Auto-refresh toutes les 2 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading && !refreshing) {
                loadData();
            }
        }, 120000); // 2 minutes

        return () => clearInterval(interval);
    }, [loading, refreshing]);

    // Fonctions utilitaires
    const getAlertIcon = (alertType) => {
        switch (alertType) {
            case 'out_of_stock': return <X className="w-5 h-5" />;
            case 'low_stock': return <TrendingDown className="w-5 h-5" />;
            case 'excess_stock': return <TrendingUp className="w-5 h-5" />;
            default: return <AlertTriangle className="w-5 h-5" />;
        }
    };

    const getAlertColor = (severity) => {
        switch (severity) {
            case 'critical': return 'text-red-500 bg-red-100 border-red-200';
            case 'high': return 'text-orange-500 bg-orange-100 border-orange-200';
            case 'medium': return 'text-yellow-500 bg-yellow-100 border-yellow-200';
            case 'low': return 'text-blue-500 bg-blue-100 border-blue-200';
            default: return 'text-gray-500 bg-gray-100 border-gray-200';
        }
    };

    const getAlertText = (alertType) => {
        switch (alertType) {
            case 'out_of_stock': return 'Rupture de stock';
            case 'low_stock': return 'Stock faible';
            case 'excess_stock': return 'Stock excessif';
            default: return 'Alerte inconnue';
        }
    };

    const getSeverityText = (severity) => {
        switch (severity) {
            case 'critical': return 'Critique';
            case 'high': return 'Élevée';
            case 'medium': return 'Moyenne';
            case 'low': return 'Faible';
            default: return severity;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    };

    // Statistiques des alertes
    const alertStats = React.useMemo(() => {
        return {
            total: alerts.length,
            critical: alerts.filter(a => a.severity === 'critical').length,
            outOfStock: alerts.filter(a => a.alert_type === 'out_of_stock').length,
            lowStock: alerts.filter(a => a.alert_type === 'low_stock').length,
            excessStock: alerts.filter(a => a.alert_type === 'excess_stock').length
        };
    }, [alerts]);

    // Modal d'action
    const ActionModal = () => {
        const [quantity, setQuantity] = useState('');
        const [targetWarehouse, setTargetWarehouse] = useState('');
        const [reason, setReason] = useState('');

        if (!showActionModal || !selectedAlert) return null;

        const handleSubmit = async (e) => {
            e.preventDefault();

            const actionData = {
                quantity: parseInt(quantity),
                targetWarehouse: parseInt(targetWarehouse),
                reason
            };

            await handleResolveAlert(selectedAlert.id, actionData);
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={`p-6 rounded-xl ${cardBgClass} w-full max-w-md`}>
                    <h3 className="text-xl font-bold mb-4">
                        {actionType === 'restock' ? 'Réapprovisionner' : 'Transférer le stock'}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Produit
                            </label>
                            <p className="text-sm text-gray-500">
                                {selectedAlert.product?.name || selectedAlert.product_name}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Entrepôt
                            </label>
                            <p className="text-sm text-gray-500">
                                {selectedAlert.warehouse?.name || selectedAlert.warehouse_name}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Quantité
                            </label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                                required
                                min="1"
                                placeholder={actionType === 'restock' ? 'Quantité à ajouter' : 'Quantité à transférer'}
                            />
                        </div>

                        {actionType === 'transfer' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Entrepôt de destination
                                </label>
                                <select
                                    value={targetWarehouse}
                                    onChange={(e) => setTargetWarehouse(e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                                    required
                                >
                                    <option value="">Sélectionner un entrepôt</option>
                                    {warehouses
                                        .filter(w => w.id !== selectedAlert.warehouse_id)
                                        .map(warehouse => (
                                            <option key={warehouse.id} value={warehouse.id}>
                                                {warehouse.name}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Raison
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                                rows="3"
                                placeholder="Raison de l'action..."
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                {actionType === 'restock' ? 'Réapprovisionner' : 'Transférer'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowActionModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // Affichage du loading
    if (loading) {
        return (
            <div className={`p-8 ${bgClass} ${textClass} min-h-screen flex items-center justify-center`}>
                <div className="flex items-center space-x-2">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span className="text-lg">Chargement des alertes...</span>
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
                        <Bell className="w-8 h-8 mr-3 text-red-500" />
                        Alertes de Stock
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Surveillance et gestion des alertes de stock en temps réel
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
                    <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                        <Settings className="w-4 h-4 mr-2" />
                        Configuration
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

            {/* Statistiques des alertes */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total alertes</p>
                            <p className="text-2xl font-bold text-red-500">{alertStats.total}</p>
                        </div>
                        <Bell className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Critiques</p>
                            <p className="text-2xl font-bold text-red-600">{alertStats.critical}</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Ruptures</p>
                            <p className="text-2xl font-bold text-red-500">{alertStats.outOfStock}</p>
                        </div>
                        <X className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Stock faible</p>
                            <p className="text-2xl font-bold text-orange-500">{alertStats.lowStock}</p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-orange-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Stock excessif</p>
                            <p className="text-2xl font-bold text-purple-500">{alertStats.excessStock}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Filtres */}
            {showFilters && (
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Recherche</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Produit ou entrepôt..."
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
                                <option value="">Tous les entrepôts</option>
                                {warehouses.map(warehouse => (
                                    <option key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Type d'alerte</label>
                            <select
                                value={filters.alert_type}
                                onChange={(e) => handleFilterChange('alert_type', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="">Tous les types</option>
                                <option value="out_of_stock">Rupture de stock</option>
                                <option value="low_stock">Stock faible</option>
                                <option value="excess_stock">Stock excessif</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Sévérité</label>
                            <select
                                value={filters.severity}
                                onChange={(e) => handleFilterChange('severity', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="">Toutes les sévérités</option>
                                <option value="critical">Critique</option>
                                <option value="high">Élevée</option>
                                <option value="medium">Moyenne</option>
                                <option value="low">Faible</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Statut</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="">Tous les statuts</option>
                                <option value="active">Actives</option>
                                <option value="resolved">Résolues</option>
                                <option value="dismissed">Ignorées</option>
                            </select>
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

            {/* Actions en lot */}
            {selectedAlertIds.size > 0 && (
                <div className={`p-4 rounded-xl border-2 border-red-500 ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <span className="font-medium">
                            {selectedAlertIds.size} alerte(s) sélectionnée(s)
                        </span>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleBulkResolve}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Résoudre toutes
                            </button>
                            <button
                                onClick={handleBulkDismiss}
                                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                            >
                                <BellOff className="w-4 h-4 mr-2" />
                                Ignorer toutes
                            </button>
                            <button
                                onClick={() => setSelectedAlertIds(new Set())}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Liste des alertes */}
            <div className={`rounded-xl border ${cardBgClass} overflow-hidden`}>
                <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">
                            Alertes actives ({alerts.length})
                        </h2>
                        {alerts.length > 0 && (
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedAlertIds.size === alerts.length && alerts.length > 0}
                                        onChange={handleSelectAll}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">Tout sélectionner</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {alerts.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50 text-green-500" />
                        <h3 className="text-xl font-medium mb-2">Aucune alerte active</h3>
                        <p>Tous les stocks sont dans les seuils normaux !</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700">
                        {alerts.map((alert) => {
                            const isSelected = selectedAlertIds.has(alert.id);
                            const isProcessing = processingAlerts.has(alert.id);
                            const alertColor = getAlertColor(alert.severity);

                            return (
                                <div
                                    key={alert.id}
                                    className={`p-6 transition-colors ${hoverBgClass} ${
                                        isSelected ? 'bg-red-50 border-l-4 border-red-500' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        {/* Checkbox et informations principales */}
                                        <div className="flex items-center space-x-4">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectAlert(alert.id)}
                                                className="w-4 h-4"
                                            />

                                            <div className={`p-3 rounded-full ${alertColor}`}>
                                                {getAlertIcon(alert.alert_type)}
                                            </div>

                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="text-lg font-semibold">
                                                        {alert.product?.name || alert.product_name}
                                                    </h3>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${alertColor}`}>
                                                        {getAlertText(alert.alert_type)}
                                                    </span>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${alertColor}`}>
                                                        {getSeverityText(alert.severity)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                                                    <span className="flex items-center">
                                                        <MapPin className="w-4 h-4 mr-1" />
                                                        {alert.warehouse?.name || alert.warehouse_name}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Calendar className="w-4 h-4 mr-1" />
                                                        {formatDate(alert.created_at)}
                                                    </span>
                                                    {alert.days_since_created !== undefined && (
                                                        <span className="flex items-center">
                                                            <Clock className="w-4 h-4 mr-1" />
                                                            Il y a {alert.days_since_created} jour(s)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Métriques et actions */}
                                        <div className="flex items-center space-x-8">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-400">Stock actuel</p>
                                                <p className="text-lg font-semibold">{alert.current_stock}</p>
                                            </div>

                                            <div className="text-center">
                                                <p className="text-sm text-gray-400">Seuil min/max</p>
                                                <p className="text-sm">
                                                    {alert.minimum_stock} / {alert.maximum_stock}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex space-x-2">
                                                {(alert.alert_type === 'out_of_stock' || alert.alert_type === 'low_stock') && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAlert(alert);
                                                            setActionType('restock');
                                                            setShowActionModal(true);
                                                        }}
                                                        disabled={isProcessing}
                                                        className="p-2 text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                                                        title="Réapprovisionner"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                )}

                                                {alert.alert_type === 'excess_stock' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAlert(alert);
                                                            setActionType('transfer');
                                                            setShowActionModal(true);
                                                        }}
                                                        disabled={isProcessing}
                                                        className="p-2 text-purple-600 hover:text-purple-800 transition-colors disabled:opacity-50"
                                                        title="Transférer"
                                                    >
                                                        <ArrowRightLeft className="w-5 h-5" />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleDismissAlert(alert.id)}
                                                    disabled={isProcessing}
                                                    className="p-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                                                    title="Ignorer"
                                                >
                                                    {isProcessing ? (
                                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <BellOff className="w-5 h-5" />
                                                    )}
                                                </button>

                                                <button
                                                    className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                                    title="Voir détails"
                                                >
                                                    <Eye className="w-5 h-5" />
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

            {/* Modal d'action */}
            <ActionModal />
        </div>
    );
};

export default StockAlertsView;