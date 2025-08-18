// ========================================
// Pour afficher les détails d'une commande en modal
// ========================================

import React, { useState, useEffect } from 'react';
import { X, Package, User, MapPin, Calendar, DollarSign } from 'lucide-react';
import { getFranchiseOrder } from '../services/api.js';

/**
 * Modal pour afficher les détails d'une commande
 */
const OrderDetailsModal = ({ orderId, isOpen, onClose, theme }) => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const modalBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const textClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';

    useEffect(() => {
        if (isOpen && orderId) {
            loadOrderDetails();
        }
    }, [isOpen, orderId]);

    const loadOrderDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getFranchiseOrder(orderId);
            setOrder(data.data || data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-xl ${modalBgClass} ${textClass}`}>
                {/* En-tête */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold">
                        Détails de la commande {order?.order_number}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Contenu */}
                <div className="p-6">
                    {loading && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2">Chargement...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {order && (
                        <div className="space-y-6">
                            {/* Informations générales */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center">
                                        <User className="w-5 h-5 mr-2" />
                                        Franchisé
                                    </h3>
                                    <div>
                                        <p className="font-medium">
                                            {order.user?.firstname} {order.user?.lastname}
                                        </p>
                                        <p className="text-sm text-gray-500">{order.user?.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center">
                                        <MapPin className="w-5 h-5 mr-2" />
                                        Entrepôt
                                    </h3>
                                    <div>
                                        <p className="font-medium">{order.warehouse?.name}</p>
                                        <p className="text-sm text-gray-500">{order.warehouse?.address}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center">
                                        <Calendar className="w-5 h-5 mr-2" />
                                        Dates
                                    </h3>
                                    <div className="text-sm space-y-1">
                                        <p><span className="text-gray-500">Créée:</span> {new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                                        {order.confirmed_at && (
                                            <p><span className="text-gray-500">Confirmée:</span> {new Date(order.confirmed_at).toLocaleDateString('fr-FR')}</p>
                                        )}
                                        {order.delivered_at && (
                                            <p><span className="text-gray-500">Livrée:</span> {new Date(order.delivered_at).toLocaleDateString('fr-FR')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Articles commandés */}
                            <div>
                                <h3 className="text-lg font-semibold flex items-center mb-4">
                                    <Package className="w-5 h-5 mr-2" />
                                    Articles commandés ({order.items?.length || 0})
                                </h3>
                                <div className="border border-gray-700 rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-700">
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
                                            <tr key={index}>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium">{item.product?.name}</p>
                                                        <p className="text-sm text-gray-500">{item.product?.description}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">{item.quantity}</td>
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
                            <div className="border-t border-gray-700 pt-4">
                                <div className="flex justify-end">
                                    <div className="w-64 space-y-2">
                                        <div className="flex justify-between">
                                            <span>Total HT:</span>
                                            <span>{formatCurrency(order.total_ht)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>TVA:</span>
                                            <span>{formatCurrency(order.total_tva)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg border-t border-gray-700 pt-2">
                                            <span>Total TTC:</span>
                                            <span>{formatCurrency(order.total_ttc)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Ratio obligatoire:</span>
                                            <span className={`font-medium ${
                                                (order.mandatory_percentage || 0) >= 80 ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                                {Math.round(order.mandatory_percentage || 0)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export { AllOrdersView as default, OrderDetailsModal };