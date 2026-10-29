<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourrierAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'courrier_id',
        'original_name',
        'path',
        'mime_type',
        'size',
    ];

    public function courrier()
    {
        return $this->belongsTo(Courrier::class);
    }
}
