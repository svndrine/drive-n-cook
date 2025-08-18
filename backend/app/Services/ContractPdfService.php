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

            // Chemin du fichier - STOCKAGE PRIVÉ
            $timestamp = date('Ymd_His');
            $year = date('Y');
            $month = date('m');

            // Nom du fichier
            $fileName = "contract_{$contract->contract_number}_{$timestamp}.pdf";

            // CHANGEMENT: Stockage dans private au lieu de public
            $relativePath = "private/contracts/{$year}/{$month}/{$fileName}";
            $fullPath = storage_path("app/{$relativePath}");

            // Créer le répertoire si nécessaire
            $directory = dirname($fullPath);
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            // Sauvegarder le PDF
            $pdf->save($fullPath);

            // IMPORTANT: Stocker le chemin relatif (pas d'URL publique)
            $contract->update([
                'contract_pdf_path' => $relativePath,
                'pdf_url' => null // Pas d'URL publique directe
            ]);

            Log::info('PDF contrat généré', [
                'contract_id' => $contract->id,
                'contract_number' => $contract->contract_number,
                'pdf_path' => $relativePath,
                'full_path' => $fullPath
            ]);

            return $relativePath;

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
     * Obtenir le contenu du PDF pour affichage sécurisé
     */
    public function getPdfContent(FranchiseContract $contract): ?string
    {
        try {
            if (!$contract->contract_pdf_path) {
                return null;
            }

            $fullPath = storage_path("app/{$contract->contract_pdf_path}");

            if (!file_exists($fullPath)) {
                Log::warning('Fichier PDF non trouvé', [
                    'contract_id' => $contract->id,
                    'path' => $fullPath
                ]);
                return null;
            }

            return file_get_contents($fullPath);

        } catch (\Exception $e) {
            Log::error('Erreur lecture PDF contrat', [
                'contract_id' => $contract->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Supprimer le PDF d'un contrat
     */
    public function deleteContractPdf(FranchiseContract $contract): bool
    {
        try {
            if ($contract->contract_pdf_path) {
                $fullPath = storage_path("app/{$contract->contract_pdf_path}");

                if (file_exists($fullPath)) {
                    unlink($fullPath);
                }

                $contract->update([
                    'contract_pdf_path' => null,
                    'pdf_url' => null
                ]);

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
