<?php

namespace App\Http\Controllers;

use App\Models\GoogleCalendarConnection;
use App\Models\User;
use App\Services\GoogleCalendarService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\Rule;

class GoogleCalendarController extends Controller
{
    public function connect(
        Request $request,
        GoogleCalendarService $googleCalendar
    ) {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'You must be logged in to connect Google Calendar.',
            ], 401);
        }

        return redirect()->away(
            $googleCalendar->authorizationUrl($user->id)
        );
    }

    public function callback(
        Request $request,
        GoogleCalendarService $googleCalendar
    ) {
        if (!$request->has('code')) {
            return response()->json([
                'message' => 'Google authorization was cancelled or failed.',
            ], 400);
        }

        if (!$request->has('state')) {
            return response()->json([
                'message' => 'Missing OAuth state.',
            ], 400);
        }

        try {
            $userId = (int) Crypt::decryptString(
                $request->get('state')
            );
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Invalid OAuth state.',
            ], 400);
        }

        $user = User::with('role')->find($userId);

        if (!$user) {
            return response()->json([
                'message' => 'Staff account not found.',
            ], 404);
        }

        if ($user->role?->name === 'Candidate') {
            return response()->json([
                'message' => 'Candidate accounts cannot connect calendars.',
            ], 403);
        }

        try {
            $token = $googleCalendar->exchangeCode(
                $request->get('code')
            );
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }

        if (!isset($token['access_token'])) {
            return response()->json([
                'message' => 'Google did not return an access token.',
            ], 400);
        }

        $token['expires_at'] = now()->timestamp +
            ($token['expires_in'] ?? 3600);

        $existingConnection =
            GoogleCalendarConnection::where(
                'user_id',
                $userId
            )->first();

        GoogleCalendarConnection::updateOrCreate(
            [
                'user_id' => $userId,
            ],
            [
                'access_token' => json_encode($token),

                // Preserve an existing refresh token if Google
                // does not return a new one.
                'refresh_token' =>
                    $token['refresh_token']
                    ?? $existingConnection?->refresh_token,

                'expires_at' =>
                    isset($token['expires_in'])
                        ? now()->addSeconds(
                            $token['expires_in']
                        )
                        : null,
            ]
        );

        $frontendUrl = env(
            'FRONTEND_URL',
            'http://localhost:5173/recruitment-system/'
        );

        return redirect()->away(
            rtrim($frontendUrl, '/') . '/admin'
        );
    }

    public function availability(
        Request $request,
        GoogleCalendarService $googleCalendar
    ) {
        $validated = $request->validate([
    'user_id' => [
        'required',
        'exists:users,id',
    ],

    'date' => [
        'required',
        'date_format:Y-m-d',
    ],

    'start_time' => [
        'nullable',
        'date_format:H:i',
        Rule::in([
            '09:00',
            '10:00',
            '11:00',
            '12:00',
            '13:00',
            '14:00',
            '15:00',
        ]),
    ],
]);

        $connection = GoogleCalendarConnection::where(
            'user_id',
            $validated['user_id']
        )->first();

        if (!$connection) {
            return response()->json([
                'message' =>
                    'This interviewer has not connected Google Calendar.',
                'connected' => false,
                'available' => false,
            ], 404);
        }

        try {
            $availability = $googleCalendar->checkAvailability(
    $connection,
    $validated['date'],
    $validated['start_time'] ?? null
);

            return response()->json([
                'connected' => true,
                'user_id' => $validated['user_id'],
                'date' => $validated['date'],
                'available' => $availability['available'],
                'suggested_time' =>
                    $availability['suggested_time'],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'connected' => true,
                'available' => false,
            ], 500);
        }
    }
}