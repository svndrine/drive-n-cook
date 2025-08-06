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

    /**
     * Create a new message instance.
     */
    public function __construct($password, Franchisee $franchisee, $isValidation = false)
    {
        $this->password = $password;
        $this->franchisee = $franchisee;
        $this->userEmail = $franchisee->user->email ?? null;
        $this->isValidation = $isValidation;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->isValidation ? 'Validation de votre compte franchisé' : 'Votre mot de passe',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.set-password',
            with: [
                'password' => $this->password,
                'franchisee' => $this->franchisee,
                'isValidation' => $this->isValidation,
            ]
        );
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
