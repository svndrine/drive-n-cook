<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Transaction;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class InvoiceController extends Controller
{
    protected $invoiceService;

    public function __construct(InvoiceService $invoiceService)
    {
        $this->invoiceService = $invoiceService;
    }

    /**
     * Liste des factures pour un franchisé
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            // Validation des filtres
            $validator = Validator::make($request->all(), [
                'status' => 'nullable|in:pending,paid,cancelled',
                'year' => 'nullable|integer|min:2020|max:' . (date('Y') + 1),
                'month' => 'nullable|integer|min:1|max:12',
                'type' => 'nullable|in:entry_fee,monthly_royalty,stock_purchase,penalty',
                'per_page' => 'nullable|integer|min:1|max:100',
                'page' => 'nullable|integer|min:1'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Paramètres invalides',
                    'errors' => $validator->errors()
                ], 400);
            }

            // Filtres
            $filters = $request->only(['status', 'year', 'month']);

            // Récupérer les factures avec pagination
            $invoices = $this->invoiceService->getUserInvoices($user->id, $filters);

            // Statistiques
            $stats = $this->invoiceService->getInvoiceStats($user->id);

            return response()->json([
                'success' => true,
                'data' => [
                    'invoices' => $invoices,
                    'stats' => $stats
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des factures', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des factures'
            ], 500);
        }
    }

    /**
     * Détails d'une facture
     */
    public function show($id): JsonResponse
    {
        try {
            $user = Auth::user();

            $invoice = Invoice::with(['transaction', 'user'])
                ->where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Facture non trouvée'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $invoice
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération de la facture', [
                'invoice_id' => $id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la facture'
            ], 500);
        }
    }

    /**
     * Télécharger le PDF d'une facture
     */
    public function downloadPdf($id)
    {
        try {
            $user = Auth::user();

            $invoice = Invoice::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Facture non trouvée'
                ], 404);
            }

            return $this->invoiceService->downloadInvoice($invoice, $user->id);

        } catch (\Exception $e) {
            Log::error('Erreur lors du téléchargement de facture', [
                'invoice_id' => $id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du téléchargement de la facture'
            ], 500);
        }
    }

    /**
     * Payer une facture (créer un intent de paiement)
     */
    public function payInvoice($id): JsonResponse
    {
        try {
            $user = Auth::user();

            $invoice = Invoice::with('transaction')
                ->where('id', $id)
                ->where('user_id', $user->id)
                ->where('status', 'pending')
                ->first();

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Facture non trouvée ou déjà payée'
                ], 404);
            }

            // Créer un intent de paiement Stripe
            $paymentService = app(\App\Services\PaymentService::class);

            $paymentIntent = $paymentService->createPaymentIntent(
                $invoice->amount_ttc,
                $user,
                "Paiement facture {$invoice->invoice_number}",
                [
                    'invoice_id' => $invoice->id,
                    'transaction_id' => $invoice->transaction_id
                ]
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'client_secret' => $paymentIntent->client_secret,
                    'payment_intent_id' => $paymentIntent->id,
                    'amount' => $invoice->amount_ttc,
                    'invoice' => $invoice
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la création du paiement de facture', [
                'invoice_id' => $id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du paiement'
            ], 500);
        }
    }

    /**
     * ADMIN - Liste de toutes les factures
     */
    public function adminIndex(Request $request): JsonResponse
    {
        try {
            // Validation des filtres
            $validator = Validator::make($request->all(), [
                'status' => 'nullable|in:pending,paid,cancelled',
                'user_id' => 'nullable|integer|exists:users,id',
                'year' => 'nullable|integer|min:2020|max:' . (date('Y') + 1),
                'month' => 'nullable|integer|min:1|max:12',
                'search' => 'nullable|string|max:255',
                'per_page' => 'nullable|integer|min:1|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Paramètres invalides',
                    'errors' => $validator->errors()
                ], 400);
            }

            $query = Invoice::with(['user', 'transaction'])
                ->orderBy('created_at', 'desc');

            // Filtres
            if ($request->status) {
                $query->where('status', $request->status);
            }

            if ($request->user_id) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->year) {
                $query->whereYear('issue_date', $request->year);
            }

            if ($request->month) {
                $query->whereMonth('issue_date', $request->month);
            }

            if ($request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('invoice_number', 'like', "%{$search}%")
                        ->orWhereHas('user', function($userQuery) use ($search) {
                            $userQuery->where('firstname', 'like', "%{$search}%")
                                ->orWhere('lastname', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            }

            $perPage = $request->get('per_page', 15);
            $invoices = $query->paginate($perPage);

            // Statistiques globales
            $stats = $this->invoiceService->getInvoiceStats();

            return response()->json([
                'success' => true,
                'data' => [
                    'invoices' => $invoices,
                    'stats' => $stats
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des factures admin', [
                'admin_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des factures'
            ], 500);
        }
    }

    /**
     * ADMIN - Générer manuellement une facture pour une transaction
     */
    public function adminCreateInvoice(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'transaction_id' => 'required|integer|exists:transactions,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Paramètres invalides',
                    'errors' => $validator->errors()
                ], 400);
            }

            $transaction = Transaction::with('user')->find($request->transaction_id);

            // Vérifier si une facture existe déjà
            $existingInvoice = Invoice::where('transaction_id', $transaction->id)->first();
            if ($existingInvoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Une facture existe déjà pour cette transaction'
                ], 400);
            }

            // Générer la facture
            $invoice = $this->invoiceService->generateInvoicePdf($transaction);

            // Envoyer par email si demandé
            if ($request->get('send_email', true)) {
                $this->invoiceService->sendInvoiceByEmail($invoice);
            }

            return response()->json([
                'success' => true,
                'message' => 'Facture générée avec succès',
                'data' => $invoice->load(['transaction', 'user'])
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la génération manuelle de facture', [
                'admin_id' => Auth::id(),
                'transaction_id' => $request->transaction_id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération de la facture'
            ], 500);
        }
    }

    /**
     * ADMIN - Marquer une facture comme payée
     */
    public function adminMarkAsPaid($id): JsonResponse
    {
        try {
            $invoice = Invoice::with(['transaction', 'user'])->find($id);

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Facture non trouvée'
                ], 404);
            }

            if ($invoice->status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette facture est déjà marquée comme payée'
                ], 400);
            }

            // Marquer comme payée
            $this->invoiceService->markAsPaid($invoice);

            // Mettre à jour la transaction associée
            $invoice->transaction->update([
                'status' => 'completed',
                'paid_at' => now()
            ]);

            Log::info('Facture marquée comme payée par admin', [
                'admin_id' => Auth::id(),
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Facture marquée comme payée',
                'data' => $invoice->fresh(['transaction', 'user'])
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors du marquage de facture comme payée', [
                'admin_id' => Auth::id(),
                'invoice_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la facture'
            ], 500);
        }
    }

    /**
     * ADMIN - Annuler une facture
     */
    public function adminCancelInvoice($id, Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Raison d\'annulation requise',
                    'errors' => $validator->errors()
                ], 400);
            }

            $invoice = Invoice::with(['transaction', 'user'])->find($id);

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Facture non trouvée'
                ], 404);
            }

            if ($invoice->status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible d\'annuler une facture déjà payée'
                ], 400);
            }

            // Annuler la facture
            $invoice->update([
                'status' => 'cancelled',
                'notes' => $request->reason
            ]);

            // Annuler la transaction associée
            $invoice->transaction->update([
                'status' => 'cancelled'
            ]);

            Log::info('Facture annulée par admin', [
                'admin_id' => Auth::id(),
                'invoice_id' => $invoice->id,
                'reason' => $request->reason
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Facture annulée avec succès',
                'data' => $invoice->fresh(['transaction', 'user'])
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'annulation de facture', [
                'admin_id' => Auth::id(),
                'invoice_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation de la facture'
            ], 500);
        }
    }

    /**
     * ADMIN - Renvoyer une facture par email
     */
    public function adminResendInvoice($id): JsonResponse
    {
        try {
            $invoice = Invoice::with(['transaction', 'user'])->find($id);

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Facture non trouvée'
                ], 404);
            }

            // Renvoyer par email
            $sent = $this->invoiceService->sendInvoiceByEmail($invoice);

            if ($sent) {
                return response()->json([
                    'success' => true,
                    'message' => 'Facture renvoyée avec succès'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'envoi de la facture'
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Erreur lors du renvoi de facture', [
                'admin_id' => Auth::id(),
                'invoice_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi de la facture'
            ], 500);
        }
    }

    /**
     * ADMIN - Statistiques avancées des factures
     */
    public function adminStats(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'period' => 'nullable|in:week,month,quarter,year',
                'year' => 'nullable|integer|min:2020|max:' . (date('Y') + 1),
                'month' => 'nullable|integer|min:1|max:12'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Paramètres invalides',
                    'errors' => $validator->errors()
                ], 400);
            }

            $period = $request->get('period', 'month');
            $year = $request->get('year', date('Y'));
            $month = $request->get('month');

            // Statistiques globales
            $globalStats = $this->invoiceService->getInvoiceStats();

            // Évolution par période
            $evolutionData = $this->getEvolutionData($period, $year, $month);

            // Top franchisés par montant facturé
            $topFranchisees = $this->getTopFranchisees();

            // Répartition par type de transaction
            $transactionTypes = $this->getTransactionTypesStats();

            // Factures en retard
            $overdueInvoices = Invoice::overdue()
                ->with(['user', 'transaction'])
                ->orderBy('due_date', 'asc')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'global_stats' => $globalStats,
                    'evolution' => $evolutionData,
                    'top_franchisees' => $topFranchisees,
                    'transaction_types' => $transactionTypes,
                    'overdue_invoices' => $overdueInvoices
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des statistiques factures', [
                'admin_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques'
            ], 500);
        }
    }

    /**
     * Obtenir l'évolution des factures par période
     */
    private function getEvolutionData($period, $year, $month = null)
    {
        $query = Invoice::selectRaw('
            DATE(issue_date) as date,
            COUNT(*) as total_invoices,
            SUM(amount_ttc) as total_amount,
            SUM(CASE WHEN status = "paid" THEN amount_ttc ELSE 0 END) as paid_amount
        ');

        switch ($period) {
            case 'week':
                $startDate = now()->startOfWeek();
                $query->where('issue_date', '>=', $startDate)
                    ->groupBy('date')
                    ->orderBy('date');
                break;

            case 'month':
                if ($month) {
                    $query->whereYear('issue_date', $year)
                        ->whereMonth('issue_date', $month);
                } else {
                    $query->whereYear('issue_date', $year);
                }
                $query->groupBy('date')->orderBy('date');
                break;

            case 'quarter':
                $quarter = ceil(date('n') / 3);
                $startMonth = ($quarter - 1) * 3 + 1;
                $endMonth = $quarter * 3;

                $query->whereYear('issue_date', $year)
                    ->whereMonth('issue_date', '>=', $startMonth)
                    ->whereMonth('issue_date', '<=', $endMonth)
                    ->groupBy('date')
                    ->orderBy('date');
                break;

            case 'year':
                $query->selectRaw('
                    YEAR(issue_date) as year,
                    MONTH(issue_date) as month,
                    COUNT(*) as total_invoices,
                    SUM(amount_ttc) as total_amount,
                    SUM(CASE WHEN status = "paid" THEN amount_ttc ELSE 0 END) as paid_amount
                ')
                    ->whereYear('issue_date', $year)
                    ->groupBy('year', 'month')
                    ->orderBy('month');
                break;
        }

        return $query->get();
    }

    /**
     * Obtenir le top des franchisés par montant facturé
     */
    private function getTopFranchisees($limit = 10)
    {
        return Invoice::selectRaw('
            user_id,
            users.firstname,
            users.lastname,
            users.email,
            COUNT(*) as total_invoices,
            SUM(amount_ttc) as total_amount,
            SUM(CASE WHEN status = "paid" THEN amount_ttc ELSE 0 END) as paid_amount,
            SUM(CASE WHEN status = "pending" THEN amount_ttc ELSE 0 END) as pending_amount
        ')
            ->join('users', 'invoices.user_id', '=', 'users.id')
            ->groupBy('user_id', 'users.firstname', 'users.lastname', 'users.email')
            ->orderBy('total_amount', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Obtenir les statistiques par type de transaction
     */
    private function getTransactionTypesStats()
    {
        return Invoice::selectRaw('
            transactions.transaction_type,
            COUNT(*) as count,
            SUM(amount_ttc) as total_amount,
            AVG(amount_ttc) as avg_amount
        ')
            ->join('transactions', 'invoices.transaction_id', '=', 'transactions.id')
            ->groupBy('transactions.transaction_type')
            ->orderBy('total_amount', 'desc')
            ->get();
    }
}
