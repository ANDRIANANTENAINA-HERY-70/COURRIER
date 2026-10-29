<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'matricule',
        'password',
        'role',
        'service_id',
        'photo',
        'is_active'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function settings()
    {
        return $this->hasOne(UserSetting::class);
    }

    public function courriers()
    {
        return $this->hasMany(Courrier::class);
    }
}
