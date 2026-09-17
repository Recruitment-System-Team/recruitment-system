<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * View all staff and candidate accounts.
     */
    public function index()
    {
        $users = User::with([
            'role',
            'candidate'
        ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'users' => $users
        ]);
    }

    public function store(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|string|min:8',
        'role' => 'required|in:HR Manager,Hiring Manager,Interviewer',
    ]);

    $role = \App\Models\Role::where(
        'name',
        $validated['role']
    )->firstOrFail();

    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => \Illuminate\Support\Facades\Hash::make(
            $validated['password']
        ),
        'role_id' => $role->id,
    ]);

    return response()->json([
        'message' => 'Staff account created successfully.',
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $role->name,
        ],
    ], 201);
}
}