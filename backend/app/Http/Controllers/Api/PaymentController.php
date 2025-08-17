<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use App\Models\Transaction;
use App\Models\FranchiseeAccount;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Obtenir le dashboard financier du franchisé connecté
     */
    public function getDashboard(): JsonResponse
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'franchisee') {
                return response()->json(['message' => 'Accès réservé aux franchisés'], 403);
            }

            $dashboard = $this->paymentService->getFranchiseeDashboard($user->id);

            return response()->json([
                'success' => true,
                'data' => $dashboard
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur dashboard franchisé: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer une intention de paiement Stripe
     */
    public function createPaymentIntent(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'transaction_id' => 'required|integer|exists:transactions,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $transactionId = $request->transaction_id;
            $transaction = Transaction::findOrFail($transactionId);

            // Vérifier que c'est bien la transaction du franchisé connecté
            if (Auth::user()->role === 'franchisee' && $transaction->user_id !== Auth::id()) {
                return response()->json(['message' => 'Transaction non autorisée'], 403);
            }

            $paymentData = $this->paymentService->createStripePaymentIntent($transactionId);

            return response()->json([
                'success' => true,
                'data' => $paymentData
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur création Payment Intent: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Impossible de créer l\'intention de paiement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les transactions du franchisé connecté
     */
    public function getTransactions(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'franchisee') {
                return response()->json(['message' => 'Accès réservé aux franchisés'], 403);
            }

            $query = Transaction::where('user_id', $user->id)
                ->with(['paymentType', 'franchiseContract']);

            // Filtres optionnels
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('payment_type')) {
                $query->whereHas('paymentType', function($q) use ($request) {
                    $q->where('code', $request->payment_type);
                });
            }

            if ($request->has('from_date')) {
                $query->where('created_at', '>=', $request->from_date);
            }

            if ($request->has('to_date')) {
                $query->where('created_at', '<=', $request->to_date);
            }

            $perPage = $request->get('per_page', 15);
            $transactions = $query->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $transactions
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération transactions: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des transactions'
            ], 500);
        }
    }

    /**
     * Obtenir les détails d'une transaction
     */
    public function getTransaction(int $transactionId): JsonResponse
    {
        try {
            $transaction = Transaction::with([
                'paymentType',
                'franchiseContract',
                'user',
                'accountMovements'
            ])->findOrFail($transactionId);

            // Vérifier les autorisations
            $user = Auth::user();
            if ($user->role === 'franchisee' && $transaction->user_id !== $user->id) {
                return response()->json(['message' => 'Transaction non autorisée'], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $transaction
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction non trouvée'
            ], 404);
        }
    }

    /**
     * Calculer les royalties pour un franchisé (admin uniquement)
     */
    public function calculateRoyalties(Request $request): JsonResponse
    {
        if (!in_array(Auth::user()->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès réservé aux administrateurs'], 403);
        }

        $validator = Validator::make($request->all(), [
            'franchisee_id' => 'required|integer|exists:users,id',
            'declared_revenue' => 'required|numeric|min:0',
            'period' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $transaction = $this->paymentService->calculateMonthlyRoyalty(
                $request->franchisee_id,
                $request->declared_revenue,
                $request->period
            );

            return response()->json([
                'success' => true,
                'message' => 'Royalties calculées avec succès',
                'data' => $transaction
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur calcul royalties: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des royalties',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Annuler une transaction (admin uniquement)
     */
    public function cancelTransaction(int $transactionId): JsonResponse
    {
        if (!in_array(Auth::user()->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès réservé aux administrateurs'], 403);
        }

        try {
            $transaction = $this->paymentService->cancelTransaction($transactionId, Auth::id());

            return response()->json([
                'success' => true,
                'message' => 'Transaction annulée avec succès',
                'data' => $transaction
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur annulation transaction: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Impossible d\'annuler la transaction',
                'error' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Obtenir les statistiques de paiements (admin uniquement)
     */
    public function getPaymentStats(Request $request): JsonResponse
    {
        if (!in_array(Auth::user()->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès réservé aux administrateurs'], 403);
        }

        try {
            $period = $request->get('period', 'month'); // month, year, all
            $startDate = match($period) {
                'month' => now()->startOfMonth(),
                'year' => now()->startOfYear(),
                default => null
            };

            $query = Transaction::query();
            if ($startDate) {
                $query->where('created_at', '>=', $startDate);
            }

            $stats = [
                'total_transactions' => $query->count(),
                'completed_transactions' => (clone $query)->where('status', 'completed')->count(),
                'pending_transactions' => (clone $query)->where('status', 'pending')->count(),
                'failed_transactions' => (clone $query)->where('status', 'failed')->count(),
                'total_amount' => (clone $query)->where('status', 'completed')->sum('amount'),
                'pending_amount' => (clone $query)->where('status', 'pending')->sum('amount'),
                'by_payment_type' => $query->with('paymentType')
                    ->where('status', 'completed')
                    ->get()
                    ->groupBy('paymentType.name')
                    ->map(function($group) {
                        return [
                            'count' => $group->count(),
                            'total_amount' => $group->sum('amount')
                        ];
                    })
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'period' => $period
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur statistiques paiements: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques'
            ], 500);
        }
    }

    /**
     * Obtenir l'historique des mouvements de compte
     */
    public function getAccountMovements(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'franchisee') {
                return response()->json(['message' => 'Accès réservé aux franchisés'], 403);
            }

            $query = $user->accountMovements()
                ->with(['transaction.paymentType', 'createdBy']);

            // Filtres optionnels
            if ($request->has('movement_type')) {
                $query->where('movement_type', $request->movement_type);
            }

            if ($request->has('category')) {
                $query->where('category', $request->category);
            }

            if ($request->has('from_date')) {
                $query->where('created_at', '>=', $request->from_date);
            }

            if ($request->has('to_date')) {
                $query->where('created_at', '<=', $request->to_date);
            }

            $perPage = $request->get('per_page', 20);
            $movements = $query->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $movements
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur historique mouvements: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'historique'
            ], 500);
        }
    }

    /**
     * Créer un ajustement manuel de compte (admin uniquement)
     */
    public function createAccountAdjustment(Request $request): JsonResponse
    {
        if (!in_array(Auth::user()->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès réservé aux administrateurs'], 403);
        }

        $validator = Validator::make($request->all(), [
            'franchisee_id' => 'required|integer|exists:users,id',
            'amount' => 'required|numeric|not_in:0',
            'type' => 'required|in:credit,debit',
            'description' => 'required|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $account = FranchiseeAccount::where('user_id', $request->franchisee_id)->first();

            if (!$account) {
                return response()->json([
                    'success' => false,
                    'message' => 'Compte franchisé non trouvé'
                ], 404);
            }

            $amount = abs($request->amount);
            $description = $request->description . " (par " . Auth::user()->firstname . " " . Auth::user()->lastname . ")";

            if ($request->type === 'credit') {
                $movement = $account->credit($amount, $description);
            } else {
                $movement = $account->debit($amount, $description);
            }

            // Mettre à jour les informations de traçabilité
            $movement->update(['created_by' => Auth::id()]);

            Log::info('Ajustement de compte effectué', [
                'franchisee_id' => $request->franchisee_id,
                'amount' => $amount,
                'type' => $request->type,
                'admin_id' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Ajustement effectué avec succès',
                'data' => [
                    'movement' => $movement,
                    'new_balance' => $account->fresh()->current_balance
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur ajustement compte: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajustement',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Obtenir les factures d'achat de stocks du franchisé
     */
    public function getStockPurchases(Request $request)
    {
        $transactions = Transaction::where('user_id', auth()->id())
            ->where('transaction_type', 'stock_purchase')
            ->with(['paymentType'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    /**
     * Payer une facture de stock via Stripe
     */
    public function payStockInvoice($transactionId)
    {
        $transaction = Transaction::where('id', $transactionId)
            ->where('user_id', auth()->id())
            ->where('transaction_type', 'stock_purchase')
            ->where('status', 'pending')
            ->firstOrFail();

        try {
            // Créer l'intention de paiement Stripe
            $paymentIntent = \Stripe\PaymentIntent::create([
                'amount' => $transaction->amount * 100, // en centimes
                'currency' => 'eur',
                'description' => $transaction->description,
                'metadata' => [
                    'transaction_id' => $transaction->id,
                    'type' => 'stock_purchase'
                ]
            ]);

            // Mettre à jour la transaction avec l'ID Stripe
            $transaction->update([
                'stripe_payment_intent_id' => $paymentIntent->id,
                'status' => 'processing'
            ]);

            return response()->json([
                'success' => true,
                'client_secret' => $paymentIntent->client_secret,
                'transaction' => $transaction
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du paiement: ' . $e->getMessage()
            ], 500);
        }
    }
}
