<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'language',
        'notifications',
        'email_notifications',
        'theme',
        'auto_save',
        'session_timeout',
        'two_factor_enabled',
        'timezone',
        'date_format',
        'time_format',
        'items_per_page',
        'sound_notifications',
        'desktop_notifications',
        'custom_settings',
    ];

    protected $casts = [
        'notifications' => 'boolean',
        'email_notifications' => 'boolean',
        'auto_save' => 'boolean',
        'two_factor_enabled' => 'boolean',
        'sound_notifications' => 'boolean',
        'desktop_notifications' => 'boolean',
        'session_timeout' => 'integer',
        'items_per_page' => 'integer',
        'custom_settings' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
