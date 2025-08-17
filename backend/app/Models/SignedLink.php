<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SignedLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'purpose', 'token', 'payload', 'expires_at', 'used_at'
    ];

    protected $casts = [
        'payload'    => 'array',
        'expires_at' => 'datetime',
        'used_at'    => 'datetime',
    ];
}
