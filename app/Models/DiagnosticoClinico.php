<?php

namespace App\Models;

use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\IcdCodeCMS;
use App\Models\User;

class DiagnosticoClinico extends Model
{
    protected $table = 'diagnosticos_clinicos';

    protected $fillable = ['nome', 'created_by', 'is_public', 'category_id', 'codigo_id', 'notes'];


    protected static function booted()
    {
        static::creating(function ($model) {
            $model->created_by = Auth::id();
        });
    }

    // cast
    protected $casts = [
        'is_public' => 'boolean',
    ];
    /**
     * Relation to the single codigo (ICD) — new model shape.
     */
    public function codigo()
    {
        return $this->belongsTo(IcdCodeCMS::class, 'codigo_id');
    }

    /**
     * Backwards-compatible accessor for `codigos` used by older frontend code.
     * Returns an array with the single codigo if present, otherwise an empty array.
     */
    public function getCodigosAttribute()
    {
        $codigo = $this->codigo()->first();
        return $codigo ? [$codigo] : [];
    }

    /**
     * Accessor to expose the single codigo as `codigo` attribute for convenience.
     */
    public function getCodigoAttribute()
    {
        return $this->codigo()->first();
    }

    public function category()
    {
        return $this->belongsTo(\App\Models\Category::class, 'category_id');
    }

    public function specialties()
    {
        return $this->belongsToMany(\App\Models\Specialty::class, 'diagnostico_specialty', 'diagnostico_clinico_id', 'specialty_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isPublic()
    {
        return $this->is_public;
    }
}
