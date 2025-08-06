<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;


class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */

    protected $fillable = [
        'firstname',
        'lastname',
        'email',
        'password',
        'role',
        'is_active',
    ];



    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function franchisee(): HasOne
    {
        return $this->hasOne(Franchisee::class);
    }

    // Ajoutez ces relations dans votre modèle User existant

    /**
     * Relation avec les contrats de franchise (pour les franchisés)
     */
    public function franchiseContracts(): HasMany
    {
        return $this->hasMany(FranchiseContract::class);
    }

    /**
     * Relation avec le contrat de franchise actif
     */
    public function activeFranchiseContract(): HasOne
    {
        return $this->hasOne(FranchiseContract::class)->where('status', 'active');
    }

    /**
     * Relation avec le compte franchisé
     */
    public function franchiseeAccount(): HasOne
    {
        return $this->hasOne(FranchiseeAccount::class);
    }

    /**
     * Relation avec les transactions
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Relation avec les mouvements de compte
     */
    public function accountMovements(): HasMany
    {
        return $this->hasMany(AccountMovement::class);
    }

    /**
     * Relation avec les échéanciers de paiement
     */
    public function paymentSchedules(): HasMany
    {
        return $this->hasMany(PaymentSchedule::class);
    }

    /**
     * Relation avec les déclarations de revenus
     */
    public function franchiseeRevenues(): HasMany
    {
        return $this->hasMany(FranchiseeRevenue::class);
    }

    /**
     * Vérifier si l'utilisateur est un franchisé
     */
    public function isFranchisee(): bool
    {
        return $this->role === 'franchisee';
    }

    /**
     * Vérifier si l'utilisateur a un contrat de franchise actif
     */
    public function hasActiveFranchiseContract(): bool
    {
        return $this->activeFranchiseContract()->exists();
    }


}
