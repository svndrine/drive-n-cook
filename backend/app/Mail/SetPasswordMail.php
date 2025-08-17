<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\Franchisee;

class SetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public $password;
    public $franchisee;
    public $userEmail;
    public $isValidation;
    public $paymentData; // AJOUTÉ : propriété manquante
    public array $extra = [];

    /**
     * Create a new message instance.
     */
    public function __construct($password, $franchisee, $isValidation = false, $paymentData = null)
    {
        $this->password = $password;
        $this->franchisee = $franchisee;
        $this->isValidation = $isValidation;
        $this->paymentData = $paymentData;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->isValidation ? 'Félicitations ! Votre franchise est validée' : 'Votre mot de passe',
        );
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        // Debug temporaire
        \Log::info('SetPasswordMail build - paymentData reçu:', [
            'paymentData' => $this->paymentData,
            'has_public_links' => isset($this->paymentData['public_links'])
        ]);

        // Extraction des liens publics si disponibles
        $publicLinks = $this->paymentData['public_links'] ?? [];

        return $this->subject($this->isValidation ? 'Félicitations ! Votre franchise est validée' : 'Votre mot de passe')
            ->view('emails.set-password')
            ->with([
                'password'     => $this->password,
                'franchisee'   => $this->franchisee,
                'isValidation' => $this->isValidation,
                'paymentData'  => $this->paymentData,
                'userEmail'    => $this->franchisee->user->email ?? $this->franchisee->email ?? 'Non disponible',

                // Données existantes de $paymentData
                'payment_url'  => $this->paymentData['payment_url'] ?? null,
                'contract'     => $this->paymentData['contract'] ?? null,
                'transaction'  => $this->paymentData['franchise_fee_transaction'] ?? null,

                // Liens publics ajoutés
                'contract_view_url'   => $publicLinks['contract_view_url'] ?? null,
                'contract_accept_url' => $publicLinks['contract_accept_url'] ?? null,
                'entry_fee_url'       => $publicLinks['entry_fee_url'] ?? null,
            ]);
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
