// frontend-admin/src/pages/ProductCatalogView.jsx
import React, { useState, useEffect } from 'react';
import {
    Package,
    Plus,
    Edit,
    Trash2,
    Copy,
    Upload,
    Download,
    Search,
    Filter,
    RefreshCw,
    Eye,
    AlertTriangle,
    CheckCircle,
    X,
    Save,
    Tag,
    DollarSign,
    Percent,
    Image as ImageIcon,
    Settings,
    Archive,
    RotateCcw
} from 'lucide-react';

// Import des fonctions API
import {
    getProducts,
    getProductCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    bulkImportProducts
} from '../services/api';

/**
 * Composant pour la gestion complète du catalogue de produits
 * @param {object} props - Propriétés du composant
 * @param {string} props.theme - Thème actuel (dark/light)
 */
const ProductCatalogView = ({ theme }) => {
    // États du composant
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // États des filtres
    const [filters, setFilters] = useState({
        search: '',
        category_id: '',
        is_mandatory: '',
        is_active: '',
        sort_by: 'name',
        sort_direction: 'asc'
    });
    const [showFilters, setShowFilters] = useState(false);

    // États pour les modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // États pour les actions
    const [processingProducts, setProcessingProducts] = useState(new Set());
    const [selectedProductIds, setSelectedProductIds] = useState(new Set());

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

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
            const params = {
                ...filters,
                page: currentPage,
                per_page: 20
            };

            // Supprimer les paramètres vides
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            // Charger les produits et catégories en parallèle
            const [productsResponse, categoriesResponse] = await Promise.all([
                getProducts(params),
                getProductCategories()
            ]);

            console.log('Produits reçus:', productsResponse);
            console.log('Catégories reçues:', categoriesResponse);

            // Gérer la réponse selon la structure de votre API
            if (productsResponse.success) {
                const productsData = productsResponse.data;

                if (Array.isArray(productsData)) {
                    // Si c'est un simple tableau
                    setProducts(productsData);
                    setTotalItems(productsData.length);
                    setTotalPages(Math.ceil(productsData.length / 20));
                } else if (productsData.data && Array.isArray(productsData.data)) {
                    // Si c'est une réponse paginée Laravel
                    setProducts(productsData.data);
                    setTotalItems(productsData.total || 0);
                    setCurrentPage(productsData.current_page || 1);
                    setTotalPages(productsData.last_page || 1);
                } else {
                    console.warn('Structure de données inattendue pour les produits:', productsData);
                    setProducts([]);
                }
            } else {
                setProducts([]);
                setError(productsResponse.message || 'Erreur lors du chargement des produits');
            }

            // Gérer les catégories
            if (categoriesResponse.success) {
                const categoriesData = categoriesResponse.data;
                setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            } else {
                setCategories([]);
                setError(categoriesResponse.message || 'Erreur lors du chargement des catégories');
            }

        } catch (err) {
            console.error('Erreur lors du chargement du catalogue:', err);
            setError(err.message || 'Erreur de connexion au serveur');
            setProducts([]);
            setCategories([]);
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
            search: '',
            category_id: '',
            is_mandatory: '',
            is_active: '',
            sort_by: 'name',
            sort_direction: 'asc'
        });
        setCurrentPage(1);
    };

    // Actions sur les produits
    const handleCreateProduct = async (productData) => {
        try {
            const response = await createProduct(productData);
            if (response.success) {
                await loadData();
                setShowCreateModal(false);
            } else {
                setError(response.message || 'Erreur lors de la création du produit');
            }
        } catch (err) {
            console.error('Erreur création produit:', err);
            setError(err.message || 'Erreur lors de la création du produit');
        }
    };

    const handleUpdateProduct = async (productData) => {
        if (!selectedProduct) return;

        try {
            const response = await updateProduct(selectedProduct.id, productData);
            if (response.success) {
                await loadData();
                setShowEditModal(false);
                setSelectedProduct(null);
            } else {
                setError(response.message || 'Erreur lors de la mise à jour du produit');
            }
        } catch (err) {
            console.error('Erreur mise à jour produit:', err);
            setError(err.message || 'Erreur lors de la mise à jour du produit');
        }
    };

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;

        try {
            const response = await deleteProduct(selectedProduct.id);
            if (response.success) {
                await loadData();
                setShowDeleteModal(false);
                setSelectedProduct(null);
            } else {
                setError(response.message || 'Erreur lors de la suppression du produit');
            }
        } catch (err) {
            console.error('Erreur suppression produit:', err);
            setError(err.message || 'Erreur lors de la suppression du produit');
        }
    };

    const handleDuplicateProduct = async (productData) => {
        try {
            const response = await duplicateProduct(selectedProduct.id, productData);
            if (response.success) {
                await loadData();
                setShowDuplicateModal(false);
                setSelectedProduct(null);
            } else {
                setError(response.message || 'Erreur lors de la duplication du produit');
            }
        } catch (err) {
            console.error('Erreur duplication produit:', err);
            setError(err.message || 'Erreur lors de la duplication du produit');
        }
    };

    const handleToggleActive = async (productId) => {
        if (processingProducts.has(productId)) return;

        setProcessingProducts(prev => new Set(prev).add(productId));
        try {
            const product = products.find(p => p.id === productId);
            if (!product) return;

            const response = await updateProduct(productId, {
                ...product,
                is_active: !product.is_active
            });

            if (response.success) {
                await loadData();
            } else {
                setError(response.message || 'Erreur lors de la mise à jour du statut');
            }
        } catch (err) {
            console.error('Erreur toggle active:', err);
            setError(err.message || 'Erreur lors de la mise à jour du statut');
        } finally {
            setProcessingProducts(prev => {
                const newSet = new Set(prev);
                newSet.delete(productId);
                return newSet;
            });
        }
    };

    // Sélection multiple
    const handleSelectAll = () => {
        if (selectedProductIds.size === products.length) {
            setSelectedProductIds(new Set());
        } else {
            setSelectedProductIds(new Set(products.map(p => p.id)));
        }
    };

    const handleSelectProduct = (productId) => {
        setSelectedProductIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    // Chargement initial
    useEffect(() => {
        loadData();
    }, [currentPage]); // Recharger quand la page change

    // Recharger quand les filtres changent (avec délai pour éviter trop d'appels)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (!loading) { // Ne pas recharger pendant le chargement initial
                loadData();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [filters]);

    // Fonctions utilitaires
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount || 0);
    };

    const getMarginPercentage = (product) => {
        if (!product.cost_price || !product.selling_price) return 0;
        return Math.round(((product.selling_price - product.cost_price) / product.selling_price) * 100);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(new Date(dateString));
    };

    // Statistiques du catalogue
    const catalogStats = React.useMemo(() => {
        return {
            totalProducts: products.length,
            activeProducts: products.filter(p => p.is_active).length,
            mandatoryProducts: products.filter(p => p.is_mandatory).length,
            averageMargin: Math.round(products.reduce((sum, p) => sum + getMarginPercentage(p), 0) / products.length || 0)
        };
    }, [products]);

    // Affichage du loading
    if (loading) {
        return (
            <div className={`p-8 ${bgClass} ${textClass} min-h-screen flex items-center justify-center`}>
                <div className="flex items-center space-x-2">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span className="text-lg">Chargement du catalogue...</span>
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
                        Catalogue des Produits
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Gestion complète du catalogue produits et prix
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
                    <button
                        onClick={() => setShowBulkImportModal(true)}
                        className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                    </button>
                    <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau produit
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

            {/* Statistiques du catalogue */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total produits</p>
                            <p className="text-2xl font-bold text-blue-500">{catalogStats.totalProducts}</p>
                        </div>
                        <Package className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Produits actifs</p>
                            <p className="text-2xl font-bold text-green-500">{catalogStats.activeProducts}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Produits obligatoires</p>
                            <p className="text-2xl font-bold text-orange-500">{catalogStats.mandatoryProducts}</p>
                        </div>
                        <Tag className="w-8 h-8 text-orange-500" />
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Marge moyenne</p>
                            <p className="text-2xl font-bold text-purple-500">{catalogStats.averageMargin}%</p>
                        </div>
                        <Percent className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Filtres */}
            {showFilters && (
                <div className={`p-6 rounded-xl border ${cardBgClass}`}>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Recherche</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Nom ou SKU..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Catégorie</label>
                            <select
                                value={filters.category_id}
                                onChange={(e) => handleFilterChange('category_id', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="">Toutes les catégories</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Type</label>
                            <select
                                value={filters.is_mandatory}
                                onChange={(e) => handleFilterChange('is_mandatory', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="">Tous les types</option>
                                <option value="true">Obligatoires</option>
                                <option value="false">Libres</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Statut</label>
                            <select
                                value={filters.is_active}
                                onChange={(e) => handleFilterChange('is_active', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="">Tous les statuts</option>
                                <option value="true">Actifs</option>
                                <option value="false">Inactifs</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Trier par</label>
                            <select
                                value={filters.sort_by}
                                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                            >
                                <option value="name">Nom</option>
                                <option value="sku">SKU</option>
                                <option value="category">Catégorie</option>
                                <option value="price">Prix</option>
                                <option value="margin">Marge</option>
                                <option value="created_at">Date de création</option>
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
            {selectedProductIds.size > 0 && (
                <div className={`p-4 rounded-xl border-2 border-blue-500 ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                        <span className="font-medium">
                            {selectedProductIds.size} produit(s) sélectionné(s)
                        </span>
                        <div className="flex space-x-3">
                            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Activer
                            </button>
                            <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                                <Archive className="w-4 h-4 mr-2" />
                                Désactiver
                            </button>
                            <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                            </button>
                            <button
                                onClick={() => setSelectedProductIds(new Set())}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Liste des produits */}
            <div className={`rounded-xl border ${cardBgClass} overflow-hidden`}>
                <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">
                            Produits du catalogue ({totalItems})
                        </h2>
                        {products.length > 0 && (
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedProductIds.size === products.length && products.length > 0}
                                        onChange={handleSelectAll}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">Tout sélectionner</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {products.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-medium mb-2">Aucun produit trouvé</h3>
                        <p>Commencez par créer votre premier produit !</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Créer un produit
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}>
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                                    Sélection
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                                    Produit
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                                    Catégorie
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider">
                                    Prix
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider">
                                    Marge
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider">
                                    Type
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
                            {products.map((product) => {
                                const isSelected = selectedProductIds.has(product.id);
                                const isProcessing = processingProducts.has(product.id);
                                const margin = getMarginPercentage(product);

                                return (
                                    <tr
                                        key={product.id}
                                        className={`transition-colors ${hoverBgClass} ${
                                            isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                        }`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectProduct(product.id)}
                                                className="w-4 h-4"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-12 w-12">
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            className="h-12 w-12 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                                            <ImageIcon className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium">
                                                        {product.name}
                                                    </div>
                                                    <div className="text-sm text-gray-400">
                                                        SKU: {product.sku}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {product.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                                {product.category?.name || 'Non catégorisé'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div>
                                                <div className="text-sm font-medium">
                                                    {formatCurrency(product.selling_price)}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Coût: {formatCurrency(product.cost_price)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`text-sm font-medium ${
                                                margin >= 50 ? 'text-green-500' :
                                                    margin >= 30 ? 'text-orange-500' : 'text-red-500'
                                            }`}>
                                                {margin}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                product.is_mandatory
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {product.is_mandatory ? 'Obligatoire' : 'Libre'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => handleToggleActive(product.id)}
                                                disabled={isProcessing}
                                                className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                                                    product.is_active
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                } disabled:opacity-50`}
                                            >
                                                {isProcessing ? (
                                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    product.is_active ? 'Actif' : 'Inactif'
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setShowDuplicateModal(true);
                                                    }}
                                                    className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                                    title="Dupliquer"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Affichage de {((currentPage - 1) * 20) + 1} à {Math.min(currentPage * 20, totalItems)} sur {totalItems} produits
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded disabled:opacity-50"
                                >
                                    Précédent
                                </button>

                                {/* Numéros de pages */}
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                                    if (page > totalPages) return null;

                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-1 text-sm rounded ${
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
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded disabled:opacity-50"
                                >
                                    Suivant
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <ProductModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateProduct}
                    categories={categories}
                    theme={theme}
                    title="Créer un nouveau produit"
                />
            )}

            {showEditModal && selectedProduct && (
                <ProductModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedProduct(null);
                    }}
                    onSubmit={handleUpdateProduct}
                    categories={categories}
                    theme={theme}
                    title="Modifier le produit"
                    initialData={selectedProduct}
                />
            )}

            {showDuplicateModal && selectedProduct && (
                <ProductModal
                    isOpen={showDuplicateModal}
                    onClose={() => {
                        setShowDuplicateModal(false);
                        setSelectedProduct(null);
                    }}
                    onSubmit={handleDuplicateProduct}
                    categories={categories}
                    theme={theme}
                    title="Dupliquer le produit"
                    initialData={{
                        ...selectedProduct,
                        name: `${selectedProduct.name} (Copie)`,
                        sku: `${selectedProduct.sku}-COPY`
                    }}
                />
            )}

            {showDeleteModal && selectedProduct && (
                <DeleteConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSelectedProduct(null);
                    }}
                    onConfirm={handleDeleteProduct}
                    theme={theme}
                    productName={selectedProduct.name}
                />
            )}

            {showBulkImportModal && (
                <BulkImportModal
                    isOpen={showBulkImportModal}
                    onClose={() => setShowBulkImportModal(false)}
                    onImport={(data) => {
                        console.log('Import en lot:', data);
                        setShowBulkImportModal(false);
                        loadData();
                    }}
                    theme={theme}
                />
            )}
        </div>
    );
};

/**
 * Modal pour créer/modifier un produit
 */
const ProductModal = ({ isOpen, onClose, onSubmit, categories, theme, title, initialData = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        category_id: '',
        cost_price: '',
        selling_price: '',
        is_mandatory: false,
        is_active: true,
        stock_minimum: '',
        stock_maximum: '',
        allergens: [],
        image_url: ''
    });

    const [availableAllergens] = useState([
        'Gluten', 'Lait', 'Œufs', 'Arachides', 'Fruits à coque',
        'Soja', 'Poisson', 'Crustacés', 'Céleri', 'Moutarde',
        'Graines de sésame', 'Sulfites', 'Lupin', 'Mollusques'
    ]);

    const modalBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const textClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    const inputBgClass = theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                sku: initialData.sku || '',
                description: initialData.description || '',
                category_id: initialData.category?.id || initialData.category_id || '',
                cost_price: initialData.cost_price || '',
                selling_price: initialData.selling_price || '',
                is_mandatory: initialData.is_mandatory || false,
                is_active: initialData.is_active !== undefined ? initialData.is_active : true,
                stock_minimum: initialData.stock_minimum || '',
                stock_maximum: initialData.stock_maximum || '',
                allergens: initialData.allergens || [],
                image_url: initialData.image_url || ''
            });
        } else {
            // Reset pour nouveau produit
            setFormData({
                name: '',
                sku: '',
                description: '',
                category_id: '',
                cost_price: '',
                selling_price: '',
                is_mandatory: false,
                is_active: true,
                stock_minimum: '',
                stock_maximum: '',
                allergens: [],
                image_url: ''
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            cost_price: parseFloat(formData.cost_price) || 0,
            selling_price: parseFloat(formData.selling_price) || 0,
            stock_minimum: parseInt(formData.stock_minimum) || 0,
            stock_maximum: parseInt(formData.stock_maximum) || 0,
            category_id: parseInt(formData.category_id) || null,
        });
    };

    const handleAllergenToggle = (allergen) => {
        setFormData(prev => ({
            ...prev,
            allergens: prev.allergens.includes(allergen)
                ? prev.allergens.filter(a => a !== allergen)
                : [...prev.allergens, allergen]
        }));
    };

    const calculateMargin = () => {
        const cost = parseFloat(formData.cost_price) || 0;
        const selling = parseFloat(formData.selling_price) || 0;
        if (cost && selling) {
            return Math.round(((selling - cost) / selling) * 100);
        }
        return 0;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-xl ${modalBgClass} ${textClass}`}>
                <div className="p-6 border-b border-gray-700">
                    <h3 className="text-lg font-semibold flex items-center">
                        <Package className="w-5 h-5 mr-2" />
                        {title}
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Informations de base */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium">Informations générales</h4>

                            <div>
                                <label className="block text-sm font-medium mb-2">Nom du produit *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">SKU *</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                                    placeholder="Ex: ING-001"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                                    rows="3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Catégorie *</label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                                    required
                                >
                                    <option value="">Sélectionner une catégorie</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">URL de l'image</label>
                                <input
                                    type="url"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                        </div>

                        {/* Prix et stocks */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium">Prix et stocks</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Prix de coût *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.cost_price}
                                        onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                                        className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Prix de vente *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.selling_price}
                                        onChange={(e) => setFormData(prev => ({ ...prev, selling_price: e.target.value }))}
                                        className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                                        required
                                    />
                                </div>
                            </div>

                            {formData.cost_price && formData.selling_price && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        Marge calculée: <strong>{calculateMargin()}%</strong>
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Stock minimum</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.stock_minimum}
                                        onChange={(e) => setFormData(prev => ({ ...prev, stock_minimum: e.target.value }))}
                                        className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Stock maximum</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.stock_maximum}
                                        onChange={(e) => setFormData(prev => ({ ...prev, stock_maximum: e.target.value }))}
                                        className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} ${textClass}`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_mandatory}
                                        onChange={(e) => setFormData(prev => ({ ...prev, is_mandatory: e.target.checked }))}
                                        className="mr-2"
                                    />
                                    <label className="text-sm font-medium">Produit obligatoire (80/20)</label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                        className="mr-2"
                                    />
                                    <label className="text-sm font-medium">Produit actif</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Allergènes */}
                    <div>
                        <h4 className="text-lg font-medium mb-4">Allergènes</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {availableAllergens.map(allergen => (
                                <label key={allergen} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.allergens.includes(allergen)}
                                        onChange={() => handleAllergenToggle(allergen)}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">{allergen}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 pt-4 border-t border-gray-700">
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
                            {initialData ? 'Modifier' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/**
 * Modal de confirmation de suppression
 */
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, theme, productName }) => {
    const modalBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const textClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className={`max-w-md w-full rounded-xl ${modalBgClass} ${textClass}`}>
                <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-center mb-2">Supprimer le produit</h3>
                    <p className="text-center text-gray-500 mb-6">
                        Êtes-vous sûr de vouloir supprimer le produit <strong>"{productName}"</strong> ?
                        Cette action est irréversible.
                    </p>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Modal pour l'import en lot
 */
const BulkImportModal = ({ isOpen, onClose, onImport, theme }) => {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);

    const modalBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const textClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';

    const handleImport = async () => {
        if (!file) return;

        setImporting(true);
        try {
            // Ici vous pouvez implémenter l'appel réel à l'API d'import
            const formData = new FormData();
            formData.append('file', file);

            // const response = await bulkImportProducts(formData);
            // if (response.success) {
            //     onImport(response.data);
            // }

            // Simulation pour l'instant
            setTimeout(() => {
                onImport({ file: file.name, rows: 25 });
                setImporting(false);
                setFile(null);
            }, 2000);
        } catch (err) {
            console.error('Erreur import:', err);
            setImporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className={`max-w-lg w-full rounded-xl ${modalBgClass} ${textClass}`}>
                <div className="p-6 border-b border-gray-700">
                    <h3 className="text-lg font-semibold flex items-center">
                        <Upload className="w-5 h-5 mr-2" />
                        Import en lot (CSV)
                    </h3>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Fichier CSV</label>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">Format attendu :</h4>
                        <p className="text-sm text-blue-700">
                            name,sku,description,category_id,cost_price,selling_price,is_mandatory,stock_minimum,stock_maximum
                        </p>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={onClose}
                            disabled={importing}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!file || importing}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                            {importing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Import en cours...
                                </>
                            ) : (
                                'Importer'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCatalogView;