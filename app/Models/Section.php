<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;


class Section extends Model
{

    protected $fillable = [
        'name',
        'kind',
        'notes',
        'specialty_id',
    ];

    protected $casts = [
        'kind' => 'string',
    ];

    public function specialty()
    {
        return $this->belongsTo(Specialty::class);
    }
}