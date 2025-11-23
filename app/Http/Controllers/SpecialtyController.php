<?php

namespace App\Http\Controllers;

use App\Models\Specialty;
use Illuminate\Http\Request;

class SpecialtyController extends Controller
{
    public function index()
    {
        $list = Specialty::orderBy('name')->get();
        return response()->json(['data' => $list]);
    }
}
