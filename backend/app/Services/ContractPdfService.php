<?php

namespace App\Services;

use App\Models\FranchiseContract;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ContractPdfService
{
    /**
     * Générer le PDF du contrat de franchise
     */
    public function generateContractPdf(FranchiseContract $contract): string
    {
        try {
            // Charger les relations nécessaires
            $contract->load(['user.franchisee']);

            $franchisee = $contract->user->franchisee;

            if (!$franchisee) {
                throw new \Exception("Données franchisé manquantes pour le contrat {$contract->id}");
            }

            // Générer le PDF avec le template
            $pdf = Pdf::loadView('contracts.franchise-contract', [
                'contract' => $contract,
                'franchisee' => $franchisee
            ]);

            // Configuration du PDF
            $pdf->setPaper('A4', 'portrait');
            $pdf->setOptions([
                'dpi' => 150,
                'defaultFont' => 'Arial',
                'isHtml5ParserEnabled' => true,
                'isPhpEnabled' => true
            ]);

            // Chemin du fichier
            $timestamp = date('Ymd_His');
            $year = date('Y');
            $month = date('m');

            // Nom du fichier
            $fileName = "contract_{$contract->contract_number}_{$timestamp}.pdf";
            $relativePath = "contracts/{$year}/{$month}/{$fileName}";
            $fullPath = storage_path("app/public/{$relativePath}");

            // Créer le répertoire si nécessaire
            $directory = dirname($fullPath);
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            // Sauvegarder le PDF
            $pdf->save($fullPath);

            // URL publique accessible via le lien symbolique
            $publicUrl = "/storage/{$relativePath}";

            // IMPORTANT: Mettre à jour le contrat avec l'URL du PDF
            $contract->update([
                'pdf_url' => $publicUrl,
                'contract_pdf_path' => $relativePath
            ]);

            Log::info('PDF contrat généré', [
                'contract_id' => $contract->id,
                'contract_number' => $contract->contract_number,
                'pdf_path' => $relativePath,
                'pdf_url' => $publicUrl
            ]);

            return $publicUrl;

        } catch (\Exception $e) {
            Log::error('Erreur génération PDF contrat', [
                'contract_id' => $contract->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            throw new \Exception('Impossible de générer le PDF du contrat: ' . $e->getMessage());
        }
    }

    /**
     * Supprimer le PDF d'un contrat
     */
    public function deleteContractPdf(FranchiseContract $contract): bool
    {
        try {
            if ($contract->pdf_url) {
                $path = str_replace('/storage/', '', $contract->pdf_url);

                if (Storage::exists($path)) {
                    Storage::delete($path);
                }

                $contract->update(['pdf_url' => null]);

                Log::info('PDF contrat supprimé', [
                    'contract_id' => $contract->id,
                    'contract_number' => $contract->contract_number
                ]);
            }

            return true;

        } catch (\Exception $e) {
            Log::error('Erreur suppression PDF contrat', [
                'contract_id' => $contract->id,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Régénérer le PDF d'un contrat (utile après modification)
     */
    public function regenerateContractPdf(FranchiseContract $contract): string
    {
        // Supprimer l'ancien PDF
        $this->deleteContractPdf($contract);

        // Générer un nouveau PDF
        return $this->generateContractPdf($contract);
    }
}
