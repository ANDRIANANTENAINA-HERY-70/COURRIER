<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Courrier extends Model
{
    use HasFactory;

    protected $fillable = [
        'objet',
        'message',
        'sender_id',
        'receiver_id',
        'fichier_path',
        'fichiers_paths',
        'is_read',
        'pending_until',
        'receiver_archived_at',
        'sender_archived_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'pending_until' => 'datetime',
        'receiver_archived_at' => 'datetime',
        'sender_archived_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    /**
     * Get fichiers_paths as array, ensuring JSON decoding
     */
    public function getFichiersPathsAttribute($value)
    {
        if (is_null($value)) {
            return [];
        }
        if (is_array($value)) {
            return $value;
        }
        return json_decode($value, true) ?? [];
    }

    /**
     * Set fichiers_paths, ensuring JSON encoding
     */
    public function setFichiersPathsAttribute($value)
    {
        if (is_array($value)) {
            $this->attributes['fichiers_paths'] = json_encode($value);
        } else {
            $this->attributes['fichiers_paths'] = $value;
        }
    }

    public function attachments()
    {
        return $this->hasMany(CourrierAttachment::class);
    }
}
