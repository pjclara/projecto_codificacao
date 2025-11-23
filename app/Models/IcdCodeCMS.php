<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IcdCodeCMS extends Model
{
    protected $table = 'icd10cms';
    protected $fillable = [
        'codigo',
        'descricao_longa',
        'capitulo',
        'categoria',
        'subcategoria',
        'notas'
    ];
}
