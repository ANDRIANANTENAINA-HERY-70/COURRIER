<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'validated_by',
        'validated_at',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'validated_at' => 'datetime',
    ];

    public function validator()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }
}
