<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Specialty extends Model
{
    protected $table = 'specialties';
    protected $fillable = ['name', 'description'];

    public function categories()
    {
        return $this->hasMany(Category::class);
    }
}
