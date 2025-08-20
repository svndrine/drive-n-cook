<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\User;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class InvoiceService
{
    /**
     * Générer une facture PDF pour une transaction
     */
    public function generateInvoicePdf(Transaction $transaction)
    {
        try {
            // Générer le numéro de facture unique
            $invoiceNumber = $this->generateInvoiceNumber();

            // Créer l'enregistrement facture
            $invoice = Invoice::create([
                'invoice_number' => $invoiceNumber,
                'transaction_id' => $transaction->id,
                'user_id' => $transaction->user_id,
                'amount_ht' => $this->calculateAmountHT($transaction->amount),
                'vat_amount' => $this->calculateVAT($transaction->amount),
                'amount_ttc' => $transaction->amount,
                'vat_rate' => 20.0, // TVA française
                'issue_date' => now(),
                'due_date' => $transaction->due_date ?? now()->addDays(30),
                'status' => $transaction->status === 'completed' ? 'paid' : 'pending'
            ]);

            // Préparer les données pour le PDF
            $data = $this->prepareInvoiceData($invoice, $transaction);

            // Générer le PDF
            $pdf = Pdf::loadView('invoices.invoice-template', $data);
            $pdf->setPaper('A4', 'portrait');

            // Nom du fichier
            $filename = "facture_{$invoiceNumber}_{$transaction->user->id}.pdf";
            $filePath = "private/invoices/{$filename}";

            // Sauvegarder le PDF
            Storage::put($filePath, $pdf->output());

            // Mettre à jour l'enregistrement avec le chemin du fichier
            $invoice->update(['pdf_path' => $filePath]);

            Log::info("Facture générée avec succès", [
                'invoice_number' => $invoiceNumber,
                'transaction_id' => $transaction->id,
                'file_path' => $filePath
            ]);

            return $invoice;

        } catch (\Exception $e) {
            Log::error("Erreur lors de la génération de facture", [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Générer un numéro de facture unique
     */
    private function generateInvoiceNumber()
    {
        $year = date('Y');
        $month = date('m');

        // Compter les factures du mois
        $count = Invoice::whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->count() + 1;

        return "FAC-{$year}{$month}-" . str_pad($count, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Préparer les données pour le template PDF
     */
    private function prepareInvoiceData(Invoice $invoice, Transaction $transaction)
    {
        $user = $transaction->user;
        $franchisee = $user->franchisee;

        return [
            'invoice' => $invoice,
            'transaction' => $transaction,
            'user' => $user,
            'franchisee' => $franchisee,
            'company' => [
                'name' => "Driv'n Cook",
                'address' => "123 Avenue de la République",
                'postal_code' => "75012",
                'city' => "Paris",
                'country' => "France",
                'siret' => "12345678901234",
                'vat_number' => "FR12345678901",
                'email' => "comptabilite@drivncook.fr",
                'phone' => "01 23 45 67 89"
            ],
            'payment_details' => $this->getPaymentDetails($transaction),
            'created_at' => now()->format('d/m/Y H:i'),
        ];
    }

    /**
     * Obtenir les détails de paiement selon le type
     */
    private function getPaymentDetails(Transaction $transaction)
    {
        $details = [
            'description' => $transaction->description,
            'reference' => $transaction->id
        ];

        switch ($transaction->transaction_type) {
            case 'entry_fee':
                $details['description'] = "Droit d'entrée franchise";
                $details['detail'] = "Paiement initial pour l'acquisition de la franchise Driv'n Cook";
                break;

            case 'monthly_royalty':
                $details['description'] = "Royalties mensuelles";
                $details['detail'] = "4% du chiffre d'affaires mensuel";
                break;

            case 'stock_purchase':
                $details['description'] = "Achat de stocks";
                $details['detail'] = "Commande produits depuis entrepôt";
                if ($transaction->order_reference) {
                    $details['reference'] = $transaction->order_reference;
                }
                break;

            case 'penalty':
                $details['description'] = "Pénalité de retard";
                $details['detail'] = "Pénalité pour paiement en retard";
                break;
        }

        return $details;
    }

    /**
     * Calculer le montant HT (sans TVA)
     */
    private function calculateAmountHT($amountTTC, $vatRate = 20.0)
    {
        return round($amountTTC / (1 + ($vatRate / 100)), 2);
    }

    /**
     * Calculer le montant de la TVA
     */
    private function calculateVAT($amountTTC, $vatRate = 20.0)
    {
        $amountHT = $this->calculateAmountHT($amountTTC, $vatRate);
        return round($amountTTC - $amountHT, 2);
    }

    /**
     * Envoyer la facture par email
     */
    public function sendInvoiceByEmail(Invoice $invoice)
    {
        try {
            $user = $invoice->user;
            $transaction = $invoice->transaction;

            // Récupérer le PDF
            $pdfContent = Storage::get($invoice->pdf_path);

            // Données pour l'email
            $emailData = [
                'user' => $user,
                'invoice' => $invoice,
                'transaction' => $transaction,
                'company_name' => "Driv'n Cook"
            ];

            // Envoyer l'email avec la facture en pièce jointe
            Mail::send('emails.invoice-confirmation', $emailData, function ($message) use ($user, $invoice, $pdfContent) {
                $message->to($user->email, $user->firstname . ' ' . $user->lastname)
                    ->subject("Facture {$invoice->invoice_number} - Driv'n Cook")
                    ->attachData($pdfContent, "facture_{$invoice->invoice_number}.pdf", [
                        'mime' => 'application/pdf'
                    ]);
            });

            // Marquer comme envoyée
            $invoice->update(['sent_at' => now()]);

            Log::info("Facture envoyée par email", [
                'invoice_number' => $invoice->invoice_number,
                'user_email' => $user->email
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error("Erreur lors de l'envoi de facture par email", [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Obtenir toutes les factures d'un utilisateur
     */
    public function getUserInvoices($userId, $filters = [])
    {
        $query = Invoice::where('user_id', $userId)
            ->with(['transaction', 'user'])
            ->orderBy('created_at', 'desc');

        // Filtres
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['year'])) {
            $query->whereYear('issue_date', $filters['year']);
        }

        if (isset($filters['month'])) {
            $query->whereMonth('issue_date', $filters['month']);
        }

        return $query->paginate(15);
    }

    /**
     * Télécharger une facture
     */
    public function downloadInvoice(Invoice $invoice, $userId = null)
    {
        // Vérifier les droits d'accès
        if ($userId && $invoice->user_id !== $userId) {
            throw new \Exception("Accès non autorisé à cette facture");
        }

        if (!Storage::exists($invoice->pdf_path)) {
            throw new \Exception("Fichier de facture introuvable");
        }

        return Storage::download($invoice->pdf_path, "facture_{$invoice->invoice_number}.pdf");
    }

    /**
     * Marquer une facture comme payée
     */
    public function markAsPaid(Invoice $invoice)
    {
        $invoice->update([
            'status' => 'paid',
            'paid_at' => now()
        ]);

        Log::info("Facture marquée comme payée", [
            'invoice_number' => $invoice->invoice_number,
            'paid_at' => now()
        ]);
    }

    /**
     * Statistiques des factures
     */
    public function getInvoiceStats($userId = null)
    {
        $query = Invoice::query();

        if ($userId) {
            $query->where('user_id', $userId);
        }

        return [
            'total_invoices' => $query->count(),
            'paid_invoices' => $query->where('status', 'paid')->count(),
            'pending_invoices' => $query->where('status', 'pending')->count(),
            'overdue_invoices' => $query->where('status', 'pending')
                ->where('due_date', '<', now())
                ->count(),
            'total_amount' => $query->sum('amount_ttc'),
            'paid_amount' => $query->where('status', 'paid')->sum('amount_ttc'),
            'pending_amount' => $query->where('status', 'pending')->sum('amount_ttc'),
        ];
    }
}
