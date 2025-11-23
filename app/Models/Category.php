<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $table = 'categories';
    protected $fillable = ['name', 'kind', 'specialty_id', 'notes'];

    public function specialty()
    {
        return $this->belongsTo(Specialty::class);
    }
}
