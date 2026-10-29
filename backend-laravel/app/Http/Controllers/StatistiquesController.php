<?php

namespace App\Http\Controllers;

use App\Models\Courrier;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;

class StatistiquesController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->get('period', 'month');
        $user = $request->user() ?? User::first();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Statistiques globales
        $incomingCount = $this->incomingBaseQuery($user)->count();
        $outgoingCount = $this->outgoingBaseQuery($user)->count();
        $totalCount = $incomingCount + $outgoingCount;
        $archivedCount = $this->archivedBaseQuery($user)->count();
        $pendingCount = $this->pendingBaseQuery($user)->count();
        $urgentCount = $this->urgentBaseQuery($user)->count();

        // Statistiques par période
        $periodStats = $this->getPeriodStats($user, $period);

        // Statistiques détaillées
        $priorityStats = [
            'urgente' => $this->priorityBaseQuery($user)->where('priorite', 'urgente')->count(),
            'normale' => $this->priorityBaseQuery($user)->where('priorite', 'normale')->count(),
            'basse' => $this->priorityBaseQuery($user)->where('priorite', 'basse')->count(),
        ];

        $serviceStats = $this->serviceStats($user);

        // Statistiques supplémentaires pour le footer du dashboard
        $activeUsersCount = User::where('is_active', true)->count();
        $totalDocuments = $this->baseScopeQuery($user)
            ->where(function ($query) {
                $query->whereNotNull('fichier_path')
                    ->orWhereNotNull('fichiers_paths');
            })
            ->count();
        $processedCount = $this->hasCourrierColumn('is_read')
            ? $this->baseScopeQuery($user)->where('is_read', true)->count()
            : $archivedCount;
        $processingRate = $totalDocuments > 0 ? round(($processedCount / $totalDocuments) * 100) : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'entrants' => $incomingCount,
                'sortants' => $outgoingCount,
                'total' => $totalCount,
                'archives' => $archivedCount,
                'enAttente' => $pendingCount,
                'urgents' => $urgentCount,
                'parPeriode' => $periodStats,
                'parService' => $serviceStats,
                'priorites' => $priorityStats,
                'periode' => $period,
                // Statistiques pour le footer du dashboard
                'utilisateursActifs' => $activeUsersCount,
                'documentsNumerises' => $totalDocuments,
                'tauxTraitement' => $processingRate,
            ],
        ]);
    }

    private function getPeriodStats(User $user, string $period)
    {
        $stats = [];

        if ($period === 'week') {
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $stats[] = [
                    'periode' => $date->locale('fr')->isoFormat('ddd'),
                    'entrants' => $this->incomingBaseQuery($user)
                        ->whereDate('created_at', $date)
                        ->count(),
                    'sortants' => $this->outgoingBaseQuery($user)
                        ->whereDate('created_at', $date)
                        ->count(),
                    'archives' => $this->archivedBaseQuery($user)
                        ->whereDate('created_at', $date)
                        ->count(),
                ];
            }
        } elseif ($period === 'year') {
            for ($i = 11; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $stats[] = [
                    'periode' => $date->locale('fr')->isoFormat('MMM'),
                    'entrants' => $this->incomingBaseQuery($user)
                        ->whereYear('created_at', $date->year)
                        ->whereMonth('created_at', $date->month)->count(),
                    'sortants' => $this->outgoingBaseQuery($user)
                        ->whereYear('created_at', $date->year)
                        ->whereMonth('created_at', $date->month)->count(),
                    'archives' => $this->archivedBaseQuery($user)
                        ->whereYear('created_at', $date->year)
                        ->whereMonth('created_at', $date->month)->count(),
                ];
            }
        } else { // month
            for ($i = 3; $i >= 0; $i--) {
                $startDate = Carbon::now()->subWeeks($i)->startOfWeek();
                $endDate = $startDate->copy()->endOfWeek();
                $stats[] = [
                    'periode' => 'Sem ' . ($i + 1),
                    'entrants' => $this->incomingBaseQuery($user)
                        ->whereBetween('created_at', [$startDate, $endDate])->count(),
                    'sortants' => $this->outgoingBaseQuery($user)
                        ->whereBetween('created_at', [$startDate, $endDate])->count(),
                    'archives' => $this->archivedBaseQuery($user)
                        ->whereBetween('created_at', [$startDate, $endDate])->count(),
                ];
            }
        }

        return $stats;
    }

    private function pendingBaseQuery(User $user)
    {
        return $this->baseScopeQuery($user)
            ->where('statut', 'en_attente');
    }

    private function urgentBaseQuery(User $user)
    {
        return $this->baseScopeQuery($user)
            ->where('priorite', 'urgente');
    }

    private function priorityBaseQuery(User $user)
    {
        return $this->baseScopeQuery($user);
    }

    private function serviceStats(User $user): array
    {
        $serviceNames = Service::query()
            ->pluck('nom', 'id')
            ->all();

        $rows = $this->baseScopeQuery($user)
            ->leftJoin('users as sender_users', 'courriers.sender_id', '=', 'sender_users.id')
            ->leftJoin('users as receiver_users', 'courriers.receiver_id', '=', 'receiver_users.id')
            ->selectRaw('COALESCE(sender_users.service_id, receiver_users.service_id) as computed_service_id, COUNT(*) as count')
            ->groupByRaw('COALESCE(sender_users.service_id, receiver_users.service_id)')
            ->orderByDesc('count')
            ->get();

        if ($rows->isEmpty()) {
            return [
                ['service' => 'Aucun service', 'count' => 0],
            ];
        }

        return $rows->map(function ($row) use ($serviceNames) {
            $serviceId = $row->computed_service_id ? (int) $row->computed_service_id : null;
            return [
                'service' => $serviceId && isset($serviceNames[$serviceId]) ? $serviceNames[$serviceId] : 'Non attribué',
                'count' => (int) $row->count,
            ];
        })->values()->all();
    }

    private function incomingBaseQuery(User $user)
    {
        return $this->baseScopeQuery($user, 'receiver');
    }

    private function outgoingBaseQuery(User $user)
    {
        return $this->baseScopeQuery($user, 'sender');
    }

    private function archivedBaseQuery(User $user)
    {
        $hasArchivedColumns = $this->hasCourrierColumn('sender_archived_at') && $this->hasCourrierColumn('receiver_archived_at');

        if ($hasArchivedColumns) {
            return Courrier::where(function ($query) use ($user) {
                $query->where(function ($q) use ($user) {
                    $q->where('sender_id', $user->id)
                        ->whereNotNull('sender_archived_at');
                    if ($this->hasCourrierColumn('sender_deleted_at')) {
                        $q->whereNull('sender_deleted_at');
                    }
                })->orWhere(function ($q) use ($user) {
                    $q->where('receiver_id', $user->id)
                        ->whereNotNull('receiver_archived_at');
                    if ($this->hasCourrierColumn('receiver_deleted_at')) {
                        $q->whereNull('receiver_deleted_at');
                    }
                });
            });
        }

        return Courrier::where(function ($query) use ($user) {
            $query->where('sender_id', $user->id)
                ->orWhere('receiver_id', $user->id);
        })->where('statut', 'archive');
    }

    private function baseScopeQuery(User $user, ?string $direction = null)
    {
        $query = Courrier::query();

        if ($direction === 'receiver') {
            $query->where('receiver_id', $user->id);
            if ($this->hasCourrierColumn('receiver_deleted_at')) {
                $query->whereNull('receiver_deleted_at');
            }

            return $query;
        }

        if ($direction === 'sender') {
            $query->where('sender_id', $user->id);
            if ($this->hasCourrierColumn('sender_deleted_at')) {
                $query->whereNull('sender_deleted_at');
            }

            return $query;
        }

        return $query->where(function ($query) use ($user) {
            $query->where(function ($q) use ($user) {
                $q->where('receiver_id', $user->id);
                if ($this->hasCourrierColumn('receiver_deleted_at')) {
                    $q->whereNull('receiver_deleted_at');
                }
            })->orWhere(function ($q) use ($user) {
                $q->where('sender_id', $user->id);
                if ($this->hasCourrierColumn('sender_deleted_at')) {
                    $q->whereNull('sender_deleted_at');
                }
            });
        });
    }

    private function hasCourrierColumn(string $column): bool
    {
        static $cache = [];
        if (!array_key_exists($column, $cache)) {
            $cache[$column] = Schema::hasColumn('courriers', $column);
        }
        return $cache[$column];
    }
}
