<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ProcedimentoClinico extends Model
{
    protected $table = 'procedimentos_clinicos';

    protected $fillable = ['nome', 'user_id', 'is_public', 'category_id', 'notes'];

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

    public function codigos()
    {
        return $this->belongsToMany(IcdCodePCS::class, 'procedimento_codigos', 'procedimento_id', 'codigo_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function specialties()
    {
        return $this->belongsToMany(Specialty::class, 'procedimento_specialty', 'procedimento_clinico_id', 'specialty_id');
    }

    public function isPublic()
    {
        return $this->is_public;
    }
}
