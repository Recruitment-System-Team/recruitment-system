<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Services\GoogleCalendarService;

class AdminController extends Controller
{
    /**
     * View all staff and candidate accounts.
     */
    public function index()
    {
        $users = User::with([
            'role',
            'candidate',
            'googleCalendarConnection'
        ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'users' => $users
        ]);
    }

    /**
     * Create a staff account.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',

            'password' => 'required|string|min:8',

            'role' => 'required|in:HR Manager,Hiring Manager,Interviewer',
            'position' => 'nullable|string|max:255',
        ]);

        $role = \App\Models\Role::where(
            'name',
            $validated['role']
        )->firstOrFail();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make(
                $validated['password']
            ),
            'role_id' => $role->id,
            'position' => $validated['position'] ?? null,
        ]);

        return response()->json([
            'message' => 'Staff account created successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $role->name,
                'position' => $user->position,
                'calendar_connected' =>
                    $user->googleCalendarConnection !== null,
            ],
        ], 201);
    }

    /**
     * Start Google Calendar connection for a staff member.
     */
    public function connectCalendar(
    Request $request,
    User $user,
    GoogleCalendarService $googleCalendar
) {
    if ($user->role?->name === 'Candidate') {
        return response()->json([
            'message' => 'Candidate accounts cannot connect calendars.'
        ], 403);
    }

    return response()->json([
        'url' => $googleCalendar->authorizationUrl($user->id),
    ]);
}
}