<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IcdCodePCS extends Model
{
    protected $table = 'icd10pcs';
    protected $fillable = [
        'codigo',
        'descricao_longa',
        'descricao_curta',
        'secoes',
        'capitulos',
        'grupos',
        'categorias',
        'subcategorias',
        'notas'
    ];
}
