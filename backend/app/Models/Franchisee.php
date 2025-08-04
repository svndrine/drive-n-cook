<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Franchisee extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'phone',
        'address',
        'zip_code',
        'city',
        'current_situation',
        'desired_zone',
        'financial_contribution',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
