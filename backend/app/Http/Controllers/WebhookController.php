<?php

namespace App\Http\Controllers;

use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

class WebhookController extends Controller
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Gérer les webhooks Stripe
     */
    public function handleStripeWebhook(Request $request): Response
    {
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature');
        $webhookSecret = env('STRIPE_WEBHOOK_SECRET');

        if (!$webhookSecret) {
            Log::error('STRIPE_WEBHOOK_SECRET non configuré');
            return response('Webhook secret not configured', 500);
        }

        try {
            // Vérifier la signature du webhook
            $event = Webhook::constructEvent($payload, $signature, $webhookSecret);
        } catch (SignatureVerificationException $e) {
            Log::error('Signature webhook Stripe invalide: ' . $e->getMessage());
            return response('Invalid signature', 400);
        } catch (\Exception $e) {
            Log::error('Erreur webhook Stripe: ' . $e->getMessage());
            return response('Webhook error', 400);
        }

        Log::info('Webhook Stripe reçu', [
            'type' => $event['type'],
            'id' => $event['id']
        ]);

        try {
            // Traiter les différents types d'événements
            switch ($event['type']) {
                case 'payment_intent.succeeded':
                    $this->handlePaymentIntentSucceeded($event['data']['object']);
                    break;

                case 'payment_intent.payment_failed':
                    $this->handlePaymentIntentFailed($event['data']['object']);
                    break;

                case 'payment_intent.canceled':
                    $this->handlePaymentIntentCanceled($event['data']['object']);
                    break;

                case 'payment_method.attached':
                    $this->handlePaymentMethodAttached($event['data']['object']);
                    break;

                default:
                    Log::info('Type d\'événement Stripe non géré: ' . $event['type']);
                    break;
            }

            return response('Webhook handled', 200);

        } catch (\Exception $e) {
            Log::error('Erreur traitement webhook Stripe', [
                'event_type' => $event['type'],
                'event_id' => $event['id'],
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response('Webhook processing error', 500);
        }
    }

    /**
     * Gérer le succès d'un paiement
     */
    private function handlePaymentIntentSucceeded(array $paymentIntent): void
    {
        $paymentIntentId = $paymentIntent['id'];

        Log::info('Paiement réussi', [
            'payment_intent_id' => $paymentIntentId,
            'amount' => $paymentIntent['amount'],
            'currency' => $paymentIntent['currency']
        ]);

        // Confirmer le paiement dans notre système
        $transaction = $this->paymentService->confirmPaymentFromWebhook($paymentIntentId, $paymentIntent);

        if ($transaction) {
            // Envoyer une notification de confirmation au franchisé
            $this->sendPaymentConfirmationNotification($transaction);

            Log::info('Paiement confirmé avec succès', [
                'transaction_id' => $transaction->id,
                'amount' => $transaction->amount,
                'franchisee_id' => $transaction->user_id
            ]);
        } else {
            Log::warning('Transaction non trouvée pour Payment Intent: ' . $paymentIntentId);
        }
    }

    /**
     * Gérer l'échec d'un paiement
     */
    private function handlePaymentIntentFailed(array $paymentIntent): void
    {
        $paymentIntentId = $paymentIntent['id'];

        Log::warning('Paiement échoué', [
            'payment_intent_id' => $paymentIntentId,
            'failure_code' => $paymentIntent['last_payment_error']['code'] ?? 'unknown',
            'failure_message' => $paymentIntent['last_payment_error']['message'] ?? 'Erreur inconnue'
        ]);

        // Marquer la transaction comme échouée
        $this->markTransactionAsFailed($paymentIntentId, $paymentIntent);
    }

    /**
     * Gérer l'annulation d'un paiement
     */
    private function handlePaymentIntentCanceled(array $paymentIntent): void
    {
        $paymentIntentId = $paymentIntent['id'];

        Log::info('Paiement annulé', [
            'payment_intent_id' => $paymentIntentId,
            'cancellation_reason' => $paymentIntent['cancellation_reason'] ?? 'unknown'
        ]);

        // Marquer la transaction comme annulée
        $this->markTransactionAsCanceled($paymentIntentId, $paymentIntent);
    }

    /**
     * Gérer l'ajout d'une méthode de paiement
     */
    private function handlePaymentMethodAttached(array $paymentMethod): void
    {
        Log::info('Méthode de paiement attachée', [
            'payment_method_id' => $paymentMethod['id'],
            'type' => $paymentMethod['type'],
            'customer' => $paymentMethod['customer'] ?? null
        ]);

        // Ici vous pourriez sauvegarder les détails de la méthode de paiement
        // pour faciliter les paiements futurs
    }

    /**
     * Marquer une transaction comme échouée
     */
    private function markTransactionAsFailed(string $paymentIntentId, array $paymentIntent): void
    {
        try {
            $transaction = \App\Models\Transaction::where('stripe_payment_intent_id', $paymentIntentId)
                ->first();

            if ($transaction) {
                $transaction->update([
                    'status' => 'failed',
                    'metadata' => array_merge($transaction->metadata ?? [], [
                        'failure_reason' => $paymentIntent['last_payment_error']['message'] ?? 'Erreur inconnue',
                        'failure_code' => $paymentIntent['last_payment_error']['code'] ?? 'unknown',
                        'failed_at' => now()->toISOString()
                    ])
                ]);

                // Envoyer une notification d'échec
                $this->sendPaymentFailureNotification($transaction, $paymentIntent['last_payment_error'] ?? []);

                Log::info('Transaction marquée comme échouée', [
                    'transaction_id' => $transaction->id
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Erreur marquage transaction échouée: ' . $e->getMessage());
        }
    }

    /**
     * Marquer une transaction comme annulée
     */
    private function markTransactionAsCanceled(string $paymentIntentId, array $paymentIntent): void
    {
        try {
            $transaction = \App\Models\Transaction::where('stripe_payment_intent_id', $paymentIntentId)
                ->first();

            if ($transaction) {
                $transaction->update([
                    'status' => 'cancelled',
                    'metadata' => array_merge($transaction->metadata ?? [], [
                        'cancellation_reason' => $paymentIntent['cancellation_reason'] ?? 'unknown',
                        'cancelled_at' => now()->toISOString()
                    ])
                ]);

                Log::info('Transaction marquée comme annulée', [
                    'transaction_id' => $transaction->id
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Erreur marquage transaction annulée: ' . $e->getMessage());
        }
    }

    /**
     * Envoyer une notification de confirmation de paiement
     */
    private function sendPaymentConfirmationNotification(\App\Models\Transaction $transaction): void
    {
        try {
            // Ici vous pouvez envoyer un email de confirmation
            // ou déclencher une notification push

            // Exemple avec un job d'email
            // \App\Jobs\SendPaymentConfirmationEmail::dispatch($transaction);

            Log::info('Notification de confirmation programmée', [
                'transaction_id' => $transaction->id,
                'franchisee_email' => $transaction->user->email
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur envoi notification confirmation: ' . $e->getMessage());
        }
    }

    /**
     * Envoyer une notification d'échec de paiement
     */
    private function sendPaymentFailureNotification(\App\Models\Transaction $transaction, array $error): void
    {
        try {
            // Envoyer un email d'échec avec les détails
            // \App\Jobs\SendPaymentFailureEmail::dispatch($transaction, $error);

            Log::info('Notification d\'échec programmée', [
                'transaction_id' => $transaction->id,
                'franchisee_email' => $transaction->user->email,
                'error_code' => $error['code'] ?? 'unknown'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur envoi notification échec: ' . $e->getMessage());
        }
    }

    /**
     * Endpoint de test pour vérifier la réception des webhooks
     */
    public function testWebhook(Request $request): Response
    {
        Log::info('Test webhook reçu', $request->all());

        return response('Test webhook OK', 200);
    }
}
