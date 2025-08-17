<?php

namespace App\Services;

use App\Models\SignedLink;
use Illuminate\Support\Str;

class SignedLinkService
{
    public static function create(int $userId, string $purpose, array $payload = [], int $ttlMinutes = 10080): SignedLink
    {
        return SignedLink::create([
            'user_id'    => $userId,
            'purpose'    => $purpose,
            'token'      => Str::random(64),
            'payload'    => $payload,
            'expires_at' => now()->addMinutes($ttlMinutes),
        ]);
    }

    public static function check(string $token, string $purpose): SignedLink
    {
        $link = SignedLink::where('token', $token)
            ->where('purpose', $purpose)
            ->firstOrFail();

        if ($link->used_at) abort(410, 'Lien déjà utilisé');
        if ($link->expires_at && now()->greaterThan($link->expires_at)) abort(410, 'Lien expiré');

        return $link;
    }
}
