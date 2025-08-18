<?php

namespace App\Http\Controllers;

use App\Models\FranchiseContract;
use App\Models\Transaction;
use App\Models\SignedLink;
use App\Services\SignedLinkService;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Services\ContractPdfService;


class PublicLinkController extends Controller
{
    // GET /api/public/contract/{token}
    public function getContract(string $token)
    {
        Log::info('=== GET CONTRACT DEBUG ===');
        Log::info('Token reçu: ' . $token);

        try {
            $link = SignedLinkService::check($token, 'contract_view');
            Log::info('SignedLinkService::check réussi pour user_id: ' . $link->user_id);

            $contract = FranchiseContract::where('user_id', $link->user_id)->latest()->firstOrFail();
            Log::info('Contrat trouvé: ' . $contract->contract_number);

            // NOUVELLE PARTIE : Générer le PDF si nécessaire
            try {
                if (!$contract->pdf_url) {
                    Log::info('Aucun PDF existant, génération en cours...');
                    $pdfService = app(\App\Services\ContractPdfService::class);
                    $pdfUrl = $pdfService->generateContractPdf($contract);
                    Log::info('PDF généré: ' . $pdfUrl);
                } else {
                    Log::info('PDF existant trouvé: ' . $contract->pdf_url);
                    $pdfUrl = $contract->pdf_url;
                }
            } catch (\Exception $pdfError) {
                Log::error('Erreur génération PDF: ' . $pdfError->getMessage());
                // Continuer sans PDF plutôt que de faire échouer toute la requête
                $pdfUrl = null;
            }

            return response()->json([
                'contract_number' => $contract->contract_number,
                'status'          => $contract->status,
                'pdf_url'         => $pdfUrl,
                'user_id'         => $link->user_id,
                'franchise_fee'   => $contract->franchise_fee,
                'royalty_rate'    => $contract->royalty_rate,
                'start_date'      => $contract->start_date->format('d/m/Y'),
                'end_date'        => $contract->end_date->format('d/m/Y'),
            ]);

        } catch (\Exception $e) {
            Log::error('=== ERREUR GET CONTRACT ===');
            Log::error('Message: ' . $e->getMessage());
            Log::error('File: ' . $e->getFile() . ':' . $e->getLine());

            return response()->json([
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }


    // POST /api/public/contract/{token}/accept
    public function acceptContract(Request $request, string $token)
    {
        Log::info('=== ACCEPT CONTRACT DEBUG ===');
        Log::info('Token reçu: ' . $token);

        try {
            $link = SignedLinkService::check($token, 'contract_view');
            Log::info('Lien contract_view trouvé pour user_id: ' . $link->user_id);

            $contract = FranchiseContract::where('user_id', $link->user_id)->latest()->first();

            if (!$contract) {
                return response()->json(['message' => 'Contrat non trouvé'], 404);
            }

            // Vérifier si déjà signé
            if ($contract->status === 'signed') {
                return response()->json([
                    'success' => true,
                    'message' => 'Contrat déjà signé',
                    'contract_number' => $contract->contract_number,
                    'status' => $contract->status,
                    'redirect' => true
                ]);
            }

            // Signer le contrat
            $contract->status = 'signed';
            $contract->signed_at = now();
            $contract->save();

            // RÉGÉNÉRER LE PDF AVEC LES SIGNATURES
            Log::info('Régénération du PDF avec signatures...');
            $pdfService = app(\App\Services\ContractPdfService::class);
            $pdfPath = $pdfService->regenerateContractPdf($contract);

            Log::info('Contrat signé et PDF régénéré avec succès');

            return response()->json([
                'success' => true,
                'message' => 'Contrat signé avec succès',
                'contract_number' => $contract->contract_number,
                'status' => $contract->status,
                'signed_at' => $contract->signed_at->format('d/m/Y à H:i'),
                'redirect' => true
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur acceptation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la signature: ' . $e->getMessage()
            ], 500);
        }
    }


    // POST /api/public/entry-fee/{token}/create-payment-intent
    public function createEntryFeeIntent(Request $request, string $token)
    {
        Log::info('=== CREATE PAYMENT INTENT DEBUG ===');
        Log::info('Token reçu: ' . $token);

        try {
            $link = SignedLinkService::check($token, 'entry_fee_payment');
            Log::info('Lien entry_fee_payment trouvé pour user_id: ' . $link->user_id);

            // Récupérer la transaction de droit d'entrée en attente pour cet utilisateur
            $transaction = Transaction::where('user_id', $link->user_id)
                ->whereHas('paymentType', function($q) {
                    $q->where('code', 'franchise_fee');
                })
                ->whereIn('status', ['pending', 'processing'])
                ->first();

            if (!$transaction) {
                Log::error('Aucune transaction franchise_fee pending pour user_id: ' . $link->user_id);

                // Debug: lister toutes les transactions pour cet utilisateur
                $allTransactions = Transaction::where('user_id', $link->user_id)->with('paymentType')->get();
                Log::info('Toutes les transactions pour user ' . $link->user_id . ':');
                foreach ($allTransactions as $t) {
                    Log::info('- ID: ' . $t->id . ', Type: ' . ($t->paymentType->code ?? 'N/A') . ', Status: ' . $t->status);
                }

                return response()->json(['message' => 'Aucune transaction de droit d\'entrée en attente'], 404);
            }

            Log::info('Transaction trouvée: ' . json_encode([
                    'id' => $transaction->id,
                    'amount' => $transaction->amount,
                    'status' => $transaction->status,
                    'description' => $transaction->description
                ]));

            // Utiliser votre PaymentService existant
            $paymentService = app(PaymentService::class);
            $paymentData = $paymentService->createStripePaymentIntent($transaction->id);

            Log::info('PaymentIntent créé avec succès');

            return response()->json([
                'clientSecret' => $paymentData['client_secret'],
                'amount' => $transaction->amount,
                'currency' => $transaction->currency ?? 'eur',
                'description' => $transaction->description,
                'transaction_id' => $transaction->id,
                'publishable_key' => $paymentData['publishable_key'] ?? env('STRIPE_KEY')
            ]);

        } catch (\Exception $e) {
            Log::error('=== ERREUR CREATE PAYMENT INTENT ===');
            Log::error('Message: ' . $e->getMessage());
            Log::error('File: ' . $e->getFile() . ':' . $e->getLine());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'message' => 'Erreur lors de la création de l\'intention de paiement: ' . $e->getMessage(),
                'debug' => [
                    'token' => $token,
                    'file' => basename($e->getFile()),
                    'line' => $e->getLine()
                ]
            ], 500);
        }
    }


    /**
     * Affiche le PDF du contrat directement dans le navigateur
     * Route: GET /public/contract/{token}
     */
    /**
     * Affiche le PDF du contrat directement dans le navigateur
     * Route: GET /public/contract/{token}/view
     */
    public function contract(string $token)
    {
        Log::info('=== DISPLAY CONTRACT PDF ===');
        Log::info('Token reçu: ' . $token);

        try {
            $link = SignedLinkService::check($token, 'contract_view');
            Log::info('SignedLinkService::check réussi pour user_id: ' . $link->user_id);

            $contract = FranchiseContract::where('user_id', $link->user_id)->latest()->firstOrFail();
            Log::info('Contrat trouvé: ' . $contract->contract_number);

            // Générer le PDF si nécessaire
            if (!$contract->contract_pdf_path) {
                Log::info('Aucun PDF existant, génération en cours...');
                $pdfService = app(\App\Services\ContractPdfService::class);
                $pdfPath = $pdfService->generateContractPdf($contract);

                // Recharger le contrat depuis la DB
                $contract = $contract->fresh();
                Log::info('PDF généré: ' . $pdfPath);
            }

            // Obtenir le contenu du PDF de manière sécurisée
            $pdfService = app(\App\Services\ContractPdfService::class);
            $pdfContent = $pdfService->getPdfContent($contract);

            if (!$pdfContent) {
                Log::error('Impossible de lire le contenu du PDF');
                return response()->json(['message' => 'PDF non accessible'], 404);
            }

            // Retourner le PDF avec les bons headers
            return response($pdfContent, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="contract_' . $contract->contract_number . '.pdf"',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0'
            ]);

        } catch (\Exception $e) {
            Log::error('=== ERREUR DISPLAY CONTRACT ===');
            Log::error('Message: ' . $e->getMessage());
            Log::error('File: ' . $e->getFile() . ':' . $e->getLine());

            return response()->json([
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

}
