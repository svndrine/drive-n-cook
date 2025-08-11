<?php

namespace App\Jobs;

use App\Models\Transaction;
use App\Models\PaymentSchedule;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class SendPaymentReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $userId;
    protected $transactionId;
    protected $reminderType;

    /**
     * Create a new job instance.
     */
    public function __construct(int $userId, ?int $transactionId = null, string $reminderType = 'upcoming')
    {
        $this->userId = $userId;
        $this->transactionId = $transactionId;
        $this->reminderType = $reminderType; // upcoming, overdue, final_notice
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $user = User::find($this->userId);

            if (!$user || $user->role !== 'franchisee') {
                Log::warning('Utilisateur non trouvé ou pas franchisé pour rappel paiement', [
                    'user_id' => $this->userId
                ]);
                return;
            }

            switch ($this->reminderType) {
                case 'upcoming':
                    $this->sendUpcomingPaymentReminder($user);
                    break;

                case 'overdue':
                    $this->sendOverduePaymentReminder($user);
                    break;

                case 'final_notice':
                    $this->sendFinalNoticeReminder($user);
                    break;

                case 'specific_transaction':
                    $this->sendSpecificTransactionReminder($user);
                    break;
            }

        } catch (\Exception $e) {
            Log::error('Erreur envoi rappel paiement', [
                'user_id' => $this->userId,
                'transaction_id' => $this->transactionId,
                'reminder_type' => $this->reminderType,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Envoyer rappel pour paiement à venir (7 jours avant)
     */
    protected function sendUpcomingPaymentReminder(User $user): void
    {
        // Récupérer les paiements programmés dans les 7 prochains jours
        $upcomingPayments = PaymentSchedule::where('user_id', $user->id)
            ->where('status', 'pending')
            ->where('due_date', '>=', now())
            ->where('due_date', '<=', now()->addDays(7))
            ->with('paymentType')
            ->get();

        if ($upcomingPayments->isEmpty()) {
            return;
        }

        foreach ($upcomingPayments as $payment) {
            try {
                // Créer transaction si pas déjà existante
                $transaction = Transaction::where('payment_schedule_id', $payment->id)->first();

                if (!$transaction) {
                    $transaction = Transaction::create([
                        'user_id' => $user->id,
                        'payment_type_id' => $payment->payment_type_id,
                        'payment_schedule_id' => $payment->id,
                        'amount' => $payment->amount,
                        'transaction_type' => $payment->payment_type->code ?? 'monthly_royalty',
                        'status' => 'pending',
                        'due_date' => $payment->due_date,
                        'description' => "Royalty mensuelle - " . Carbon::parse($payment->due_date)->format('m/Y')
                    ]);
                }

                // TODO: Envoyer email avec PaymentReminderMail
                // Mail::to($user->email)->queue(new PaymentReminderMail($user, $transaction, 'upcoming'));

                Log::info('Rappel paiement à venir envoyé', [
                    'user_id' => $user->id,
                    'transaction_id' => $transaction->id,
                    'due_date' => $payment->due_date,
                    'amount' => $payment->amount
                ]);

            } catch (\Exception $e) {
                Log::error('Erreur envoi rappel paiement à venir', [
                    'user_id' => $user->id,
                    'payment_schedule_id' => $payment->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Envoyer rappel pour paiement en retard
     */
    protected function sendOverduePaymentReminder(User $user): void
    {
        // Récupérer les paiements en retard
        $overdueTransactions = Transaction::where('user_id', $user->id)
            ->where('status', 'pending')
            ->where('due_date', '<', now())
            ->with(['paymentType', 'paymentSchedule'])
            ->get();

        if ($overdueTransactions->isEmpty()) {
            return;
        }

        $totalOverdueAmount = $overdueTransactions->sum('amount');
        $oldestTransaction = $overdueTransactions->sortBy('due_date')->first();
        $daysPastDue = Carbon::parse($oldestTransaction->due_date)->diffInDays(now());

        // Calculer pénalités si applicable (exemple: 2% par mois de retard)
        $penaltyRate = 0.02; // 2% par mois
        $monthsPastDue = ceil($daysPastDue / 30);
        $penaltyAmount = $totalOverdueAmount * $penaltyRate * $monthsPastDue;

        try {
            // TODO: Envoyer email avec OverduePaymentMail
            // Mail::to($user->email)->queue(new OverduePaymentMail($user, $overdueTransactions, $penaltyAmount));

            // Programmer relance automatique dans 7 jours si toujours pas payé
            if ($daysPastDue >= 14) {
                SendPaymentReminderJob::dispatch($user->id, null, 'final_notice')
                    ->delay(now()->addDays(7));
            }

            Log::warning('Rappel paiement en retard envoyé', [
                'user_id' => $user->id,
                'overdue_transactions' => $overdueTransactions->count(),
                'total_amount' => $totalOverdueAmount,
                'days_past_due' => $daysPastDue,
                'penalty_amount' => $penaltyAmount
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur envoi rappel paiement en retard', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Envoyer mise en demeure finale
     */
    protected function sendFinalNoticeReminder(User $user): void
    {
        // Récupérer tous les paiements en retard depuis plus de 21 jours
        $criticalOverdueTransactions = Transaction::where('user_id', $user->id)
            ->where('status', 'pending')
            ->where('due_date', '<', now()->subDays(21))
            ->with(['paymentType', 'franchiseContract'])
            ->get();

        if ($criticalOverdueTransactions->isEmpty()) {
            return;
        }

        $totalOwed = $criticalOverdueTransactions->sum('amount');
        $franchiseContract = $criticalOverdueTransactions->first()->franchiseContract;

        try {
            // TODO: Envoyer email de mise en demeure avec FinalNoticeMail
            // Mail::to($user->email)->queue(new FinalNoticeMail($user, $criticalOverdueTransactions, $franchiseContract));

            // Marquer le contrat comme "at_risk"
            if ($franchiseContract) {
                $franchiseContract->update([
                    'status' => 'at_risk',
                    'risk_level' => 'high'
                ]);
            }

            // Notifier les administrateurs
            $adminUsers = User::whereIn('role', ['admin', 'superadmin'])->get();
            foreach ($adminUsers as $admin) {
                // TODO: Envoyer notification admin
                // Mail::to($admin->email)->queue(new FranchiseeRiskAlert($user, $totalOwed));
            }

            Log::critical('Mise en demeure finale envoyée', [
                'user_id' => $user->id,
                'total_owed' => $totalOwed,
                'overdue_transactions' => $criticalOverdueTransactions->count(),
                'contract_id' => $franchiseContract?->id
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur envoi mise en demeure finale', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Envoyer rappel pour une transaction spécifique
     */
    protected function sendSpecificTransactionReminder(User $user): void
    {
        if (!$this->transactionId) {
            return;
        }

        $transaction = Transaction::with(['paymentType', 'franchiseContract'])
            ->find($this->transactionId);

        if (!$transaction || $transaction->user_id !== $user->id) {
            Log::warning('Transaction non trouvée pour rappel spécifique', [
                'transaction_id' => $this->transactionId,
                'user_id' => $user->id
            ]);
            return;
        }

        if ($transaction->status !== 'pending') {
            Log::info('Transaction déjà traitée, rappel annulé', [
                'transaction_id' => $this->transactionId,
                'status' => $transaction->status
            ]);
            return;
        }

        try {
            // TODO: Envoyer email avec SpecificTransactionReminderMail
            // Mail::to($user->email)->queue(new SpecificTransactionReminderMail($user, $transaction));

            Log::info('Rappel transaction spécifique envoyé', [
                'user_id' => $user->id,
                'transaction_id' => $transaction->id,
                'amount' => $transaction->amount,
                'type' => $transaction->transaction_type
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur rappel transaction spécifique', [
                'transaction_id' => $this->transactionId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Programmer les prochains rappels automatiques
     */
    public static function scheduleAutomaticReminders(): void
    {
        // Rappels pour paiements à venir (7 jours avant)
        $upcomingPayments = PaymentSchedule::where('status', 'pending')
            ->where('due_date', '=', now()->addDays(7)->toDateString())
            ->pluck('user_id')
            ->unique();

        foreach ($upcomingPayments as $userId) {
            self::dispatch($userId, null, 'upcoming');
        }

        // Rappels pour paiements en retard
        $overduePayments = Transaction::where('status', 'pending')
            ->where('due_date', '<', now())
            ->pluck('user_id')
            ->unique();

        foreach ($overduePayments as $userId) {
            self::dispatch($userId, null, 'overdue');
        }

        Log::info('Rappels automatiques programmés', [
            'upcoming_count' => $upcomingPayments->count(),
            'overdue_count' => $overduePayments->count()
        ]);
    }

    /**
     * The job failed to process.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Échec envoi rappel paiement', [
            'user_id' => $this->userId,
            'transaction_id' => $this->transactionId,
            'reminder_type' => $this->reminderType,
            'error' => $exception->getMessage()
        ]);
    }
}
