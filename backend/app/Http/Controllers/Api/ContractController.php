<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FranchiseContract;
use App\Models\User;
use App\Models\Franchisee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ContractController extends Controller
{
    /**
     * Obtenir tous les contrats (admin uniquement)
     */
    public function index(Request $request): JsonResponse
    {
        if (!in_array(Auth::user()->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès réservé aux administrateurs'], 403);
        }

        try {
            $query = FranchiseContract::with(['user.franchisee', 'transactions']);

            // Filtres
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->whereHas('user', function($q) use ($search) {
                    $q->where('firstname', 'like', "%{$search}%")
                        ->orWhere('lastname', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhere('contract_number', 'like', "%{$search}%");
            }

            if ($request->has('from_date')) {
                $query->where('created_at', '>=', $request->from_date);
            }

            if ($request->has('to_date')) {
                $query->where('created_at', '<=', $request->to_date);
            }

            $perPage = $request->get('per_page', 15);
            $contracts = $query->orderBy('created_at', 'desc')->paginate($perPage);

            // Ajouter des statistiques
            $stats = [
                'total' => FranchiseContract::count(),
                'active' => FranchiseContract::where('status', 'active')->count(),
                'pending' => FranchiseContract::where('status', 'pending')->count(),
                'suspended' => FranchiseContract::where('status', 'suspended')->count(),
                'terminated' => FranchiseContract::where('status', 'terminated')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $contracts,
                'stats' => $stats
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération contrats: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des contrats'
            ], 500);
        }
    }

    /**
     * Obtenir le contrat du franchisé connecté
     */
    public function getMyContract(): JsonResponse
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'franchisee') {
                return response()->json(['message' => 'Accès réservé aux franchisés'], 403);
            }

            $contract = FranchiseContract::where('user_id', $user->id)
                ->with(['transactions', 'paymentSchedules'])
                ->first();

            if (!$contract) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun contrat trouvé'
                ], 404);
            }

            // Ajouter des informations calculées
            $contractData = $contract->toArray();
            $contractData['total_paid'] = $contract->transactions()
                ->where('status', 'completed')
                ->sum('amount');

            $contractData['pending_amount'] = $contract->transactions()
                ->where('status', 'pending')
                ->sum('amount');

            $contractData['next_payment'] = $contract->paymentSchedules()
                ->where('status', 'pending')
                ->where('due_date', '>', now())
                ->orderBy('due_date')
                ->first();

            return response()->json([
                'success' => true,
                'data' => $contractData
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération contrat franchisé: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du contrat'
            ], 500);
        }
    }

    /**
     * Obtenir un contrat spécifique
     */
    public function show(int $contractId): JsonResponse
    {
        try {
            $contract = FranchiseContract::with([
                'user.franchisee',
                'transactions.paymentType',
                'paymentSchedules',
                'accountMovements'
            ])->findOrFail($contractId);

            // Vérifier les autorisations
            $user = Auth::user();
            if ($user->role === 'franchisee' && $contract->user_id !== $user->id) {
                return response()->json(['message' => 'Contrat non autorisé'], 403);
            }

            // Calculer des métriques
            $metrics = [
                'total_revenue_generated' => $contract->transactions()
                    ->where('status', 'completed')
                    ->where('transaction_type', 'monthly_royalty')
                    ->sum('amount'),
                'entry_fee_paid' => $contract->transactions()
                    ->where('status', 'completed')
                    ->where('transaction_type', 'entry_fee')
                    ->sum('amount'),
                'pending_payments' => $contract->transactions()
                    ->where('status', 'pending')
                    ->sum('amount'),
                'contract_duration_months' => $contract->created_at->diffInMonths(now()),
                'average_monthly_payment' => $contract->transactions()
                        ->where('status', 'completed')
                        ->where('transaction_type', 'monthly_royalty')
                        ->avg('amount') ?? 0
            ];

            return response()->json([
                'success' => true,
                'data' => array_merge($contract->toArray(), ['metrics' => $metrics])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Contrat non trouvé'
            ], 404);
        }
    }

    /**
     * Créer un nouveau contrat (admin uniquement)
     */
    public function store(Request $request): JsonResponse
    {
        if (!in_array(Auth::user()->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès réservé aux administrateurs'], 403);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'entry_fee' => 'required|numeric|min:0',
            'royalty_percentage' => 'required|numeric|min:0|max:100',
            'contract_duration_months' => 'required|integer|min:1',
            'territory_description' => 'nullable|string|max:1000',
            'special_conditions' => 'nullable|string',
            'start_date' => 'nullable|date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            // Vérifier que l'utilisateur est bien un franchisé
            $user = User::find($request->user_id);
            if (!$user || $user->role !== 'franchisee') {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur invalide ou pas franchisé'
                ], 400);
            }

            // Vérifier qu'il n'a pas déjà un contrat actif
            $existingContract = FranchiseContract::where('user_id', $user->id)
                ->whereIn('status', ['pending', 'active'])
                ->first();

            if ($existingContract) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce franchisé a déjà un contrat actif'
                ], 400);
            }

            // Générer le numéro de contrat
            $contractNumber = 'DC-' . date('Ym') . '-' . str_pad(
                    FranchiseContract::whereYear('created_at', now()->year)
                        ->whereMonth('created_at', now()->month)
                        ->count() + 1,
                    4, '0', STR_PAD_LEFT
                );

            // Créer le contrat
            $contract = FranchiseContract::create([
                'user_id' => $user->id,
                'contract_number' => $contractNumber,
                'entry_fee' => $request->entry_fee,
                'royalty_percentage' => $request->royalty_percentage,
                'contract_duration_months' => $request->contract_duration_months,
                'territory_description' => $request->territory_description,
                'special_conditions' => $request->special_conditions,
                'start_date' => $request->start_date ?? now(),
                'end_date' => Carbon::parse($request->start_date ?? now())
                    ->addMonths($request->contract_duration_months),
                'status' => 'pending',
                'created_by' => Auth::id()
            ]);

            Log::info('Nouveau contrat créé', [
                'contract_id' => $contract->id,
                'contract_number' => $contractNumber,
                'user_id' => $user->id,
                'created_by' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Contrat créé avec succès',
                'data' => $contract->load('user.franchisee')
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erreur création contrat: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du contrat',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour un contrat (admin uniquement)
     */
    public function update(Request $request, int $contractId): JsonResponse
    {
        if (!in_array(Auth::user()->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès réservé aux administrateurs'], 403);
        }

        $validator = Validator::make($request->all(), [
            'royalty_percentage' => 'sometimes|numeric|min:0|max:100',
            'territory_description' => 'sometimes|nullable|string|max:1000',
            'special_conditions' => 'sometimes|nullable|string',
            'status' => 'sometimes|in:pending,active,suspended,terminated',
            'end_date' => 'sometimes|nullable|date|after:start_date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $contract = FranchiseContract::findOrFail($contractId);

            // Sauvegarder les anciennes valeurs pour le log
            $oldValues = $contract->toArray();

            $contract->update($request->only([
                'royalty_percentage',
                'territory_description',
                'special_conditions',
                'status',
                'end_date'
            ]));

            // Log des modifications
            $changes = array_diff_assoc($request->only([
                'royalty_percentage',
                'territory_description',
                'special_conditions',
                'status',
                'end_date'
            ]), $oldValues);

            if (!empty($changes)) {
                Log::info('Contrat modifié', [
                    'contract_id' => $contract->id,
                    'changes' => $changes,
                    'updated_by' => Auth::id()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Contrat mis à jour avec succès',
                'data' => $contract->fresh()->load('user.franchisee')
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur mise à jour contrat: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du contrat'
            ], 500);
        }
    }

    /**
     * Suspendre un contrat (admin uniquement)
     */
    public function suspend(Request $request, int $contractId): JsonResponse
    {
        if (!in_array(Auth::user()->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès réservé aux administrateurs'], 403);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
            'suspension_duration_days' => 'nullable|integer|min:1'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $contract = FranchiseContract::findOrFail($contractId);

            if ($contract->status === 'terminated') {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de suspendre un contrat terminé'
                ], 400);
            }

            $suspensionUntil = $request->suspension_duration_days
                ? now()->addDays($request->suspension_duration_days)
                : null;

            $contract->update([
                'status' => 'suspended',
                'suspended_at' => now(),
                'suspension_reason' => $request->reason,
                'suspension_until' => $suspensionUntil,
                'suspended_by' => Auth::id()
            ]);

            // Suspendre aussi l'utilisateur
            $contract->user->update(['is_active' => false]);

            Log::warning('Contrat suspendu', [
                'contract_id' => $contract->id,
                'user_id' => $contract->user_id,
                'reason' => $request->reason,
                'suspended_by' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Contrat suspendu avec succès',
                'data' => $contract->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur suspension contrat: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suspension du contrat'
            ], 500);
        }
    }

    /**
     * Réactiver un contrat suspendu (admin uniquement)
     */
    public function reactivate(int $contractId): JsonResponse
    {
        if (!in_array(Auth::user()->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès réservé aux administrateurs'], 403);
        }

        try {
            $contract = FranchiseContract::findOrFail($contractId);

            if ($contract->status !== 'suspended') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les contrats suspendus peuvent être réactivés'
                ], 400);
            }

            $contract->update([
                'status' => 'active',
                'suspended_at' => null,
                'suspension_reason' => null,
                'suspension_until' => null,
                'suspended_by' => null,
                'reactivated_at' => now(),
                'reactivated_by' => Auth::id()
            ]);

            // Réactiver l'utilisateur
            $contract->user->update(['is_active' => true]);

            Log::info('Contrat réactivé', [
                'contract_id' => $contract->id,
                'user_id' => $contract->user_id,
                'reactivated_by' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Contrat réactivé avec succès',
                'data' => $contract->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur réactivation contrat: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réactivation du contrat'
            ], 500);
        }
    }

    /**
     * Terminer un contrat (admin uniquement)
     */
    public function terminate(Request $request, int $contractId): JsonResponse
    {
        if (!in_array(Auth::user()->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès réservé aux administrateurs'], 403);
        }

        $validator = Validator::make($request->all(), [
            'termination_reason' => 'required|string|max:500',
            'termination_type' => 'required|in:voluntary,breach,expiration'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $contract = FranchiseContract::findOrFail($contractId);

            if ($contract->status === 'terminated') {
                return response()->json([
                    'success' => false,
                    'message' => 'Le contrat est déjà terminé'
                ], 400);
            }

            $contract->update([
                'status' => 'terminated',
                'terminated_at' => now(),
                'termination_reason' => $request->termination_reason,
                'termination_type' => $request->termination_type,
                'terminated_by' => Auth::id()
            ]);

            // Désactiver l'utilisateur
            $contract->user->update(['is_active' => false]);

            // Annuler les paiements programmés futurs
            $contract->paymentSchedules()
                ->where('status', 'pending')
                ->where('due_date', '>', now())
                ->update(['status' => 'canceled']);

            Log::warning('Contrat terminé', [
                'contract_id' => $contract->id,
                'user_id' => $contract->user_id,
                'reason' => $request->termination_reason,
                'type' => $request->termination_type,
                'terminated_by' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Contrat terminé avec succès',
                'data' => $contract->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur terminaison contrat: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la terminaison du contrat'
            ], 500);
        }
    }

    /**
     * Générer le PDF du contrat
     */
    public function generatePdf(int $contractId): JsonResponse
    {
        try {
            $contract = FranchiseContract::with('user.franchisee')->findOrFail($contractId);

            // Vérifier les autorisations
            $user = Auth::user();
            if ($user->role === 'franchisee' && $contract->user_id !== $user->id) {
                return response()->json(['message' => 'Contrat non autorisé'], 403);
            }

            // TODO: Générer le PDF avec une libraire comme DomPDF ou wkhtmltopdf
            // Pour l'instant, on retourne juste les données du contrat
            $contractData = [
                'contract' => $contract,
                'generation_date' => now()->format('d/m/Y H:i:s'),
                'generated_by' => Auth::user()->firstname . ' ' . Auth::user()->lastname
            ];

            // Simuler la génération du PDF
            $pdfPath = 'contracts/contract_' . $contract->contract_number . '_' . date('Ymd') . '.pdf';

            Log::info('PDF contrat généré', [
                'contract_id' => $contract->id,
                'path' => $pdfPath,
                'generated_by' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'PDF généré avec succès',
                'data' => [
                    'pdf_url' => Storage::url($pdfPath),
                    'contract_data' => $contractData
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur génération PDF contrat: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du PDF'
            ], 500);
        }
    }

    /**
     * Obtenir l'historique des modifications d'un contrat
     */
    public function getHistory(int $contractId): JsonResponse
    {
        try {
            $contract = FranchiseContract::findOrFail($contractId);

            // Vérifier les autorisations
            $user = Auth::user();
            if ($user->role === 'franchisee' && $contract->user_id !== $user->id) {
                return response()->json(['message' => 'Contrat non autorisé'], 403);
            }

            // TODO: Implémenter un système d'audit trail
            // Pour l'instant, retourner les informations basiques
            $history = [
                [
                    'action' => 'created',
                    'date' => $contract->created_at,
                    'user' => 'System', // $contract->creator->name
                    'details' => 'Contrat créé'
                ]
            ];

            if ($contract->activated_at) {
                $history[] = [
                    'action' => 'activated',
                    'date' => $contract->activated_at,
                    'user' => 'System',
                    'details' => 'Contrat activé suite au paiement du droit d\'entrée'
                ];
            }

            if ($contract->suspended_at) {
                $history[] = [
                    'action' => 'suspended',
                    'date' => $contract->suspended_at,
                    'user' => 'Admin', // $contract->suspendedBy->name
                    'details' => $contract->suspension_reason
                ];
            }

            if ($contract->terminated_at) {
                $history[] = [
                    'action' => 'terminated',
                    'date' => $contract->terminated_at,
                    'user' => 'Admin', // $contract->terminatedBy->name
                    'details' => $contract->termination_reason
                ];
            }

            return response()->json([
                'success' => true,
                'data' => collect($history)->sortBy('date')->values()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Contrat non trouvé'
            ], 404);
        }
    }
}
