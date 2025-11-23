<?php

namespace App\Models;

use Illuminate\Support\Facades\Auth;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Favorito extends Model
{
    /** @use HasFactory<\Database\Factories\FavoritoFactory> */
    use HasFactory;

    protected $fillable = [
        'tabela_origem',
        'codigo_id',
        'category_id',
        'section_id',
        'specialty_id',
        'personal',
    ];
    // set user_id automatically
    protected static function booted()
    {
        static::creating(function ($model) {
            $model->user_id = Auth::id();
        });
    }

    // get related codigo
    protected $appends = ['codigo_detalhe'];

    public function getCodigoDetalheAttribute()
    {
        if ($this->tabela_origem === 'icd10cms') {
            return DB::table('icd10cms')->find($this->codigo_id);
        }
        return DB::table('icd10pcs')->find($this->codigo_id);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'favorito_user')->withTimestamps();
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function specialty()
    {
        return $this->belongsTo(Specialty::class);
    }

    // section
    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    // codigo
    public function codigo()
    {
        if ($this->tabela_origem === 'icd10cms') {
            return $this->belongsTo(IcdCodeCMS::class, 'codigo_id');
        }
        return $this->belongsTo(IcdCodePCS::class, 'codigo_id');
    }




}
