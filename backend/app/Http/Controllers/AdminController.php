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

/**
 * Delete a user account.
 */
public function destroy(Request $request, User $user)
{
    // Prevent the currently logged-in admin from deleting themselves
    if ($request->user()->id === $user->id) {
        return response()->json([
            'message' => 'You cannot delete your own account.'
        ], 403);
    }

    // Prevent deleting another System Administrator
    if ($user->role?->name === 'System Administrator') {
        return response()->json([
            'message' => 'System Administrator accounts cannot be deleted.'
        ], 403);
    }

    // Remove Google Calendar connection first
    if ($user->googleCalendarConnection) {
        $user->googleCalendarConnection->delete();
    }

    // Remove candidate profile if this is a candidate
    if ($user->candidate) {
        $user->candidate->delete();
    }

    // Delete the user
    $user->delete();

    return response()->json([
        'message' => 'User account deleted successfully.'
    ]);
}
}