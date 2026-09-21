<?php

namespace App\Services;

use App\Models\GoogleCalendarConnection;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;

class GoogleCalendarService
{
    private string $clientId;
    private string $clientSecret;
    private string $redirectUri;

    public function __construct()
    {
        $this->clientId = config('services.google.client_id');
        $this->clientSecret = config('services.google.client_secret');
        $this->redirectUri = config('services.google.redirect');
    }

    /**
     * Create the Google OAuth authorization URL.
     */
    public function authorizationUrl(int $userId): string
    {
        $state = Crypt::encryptString((string) $userId);

        $params = [
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUri,
            'response_type' => 'code',
            'scope' => 'https://www.googleapis.com/auth/calendar.readonly',
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $state,
        ];

        return 'https://accounts.google.com/o/oauth2/v2/auth?' .
            http_build_query($params);
    }

    /**
     * Exchange Google's authorization code for access and refresh tokens.
     */
    public function exchangeCode(string $code): array
    {
        $response = Http::asForm()->post(
            'https://oauth2.googleapis.com/token',
            [
                'code' => $code,
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'redirect_uri' => $this->redirectUri,
                'grant_type' => 'authorization_code',
            ]
        );

        if (!$response->successful()) {
            throw new \Exception(
                'Google token exchange failed: ' . $response->body()
            );
        }

        return $response->json();
    }

    /**
     * Get a valid access token.
     */
    public function getAccessToken(
        GoogleCalendarConnection $connection
    ): string {
        $token = json_decode(
            $connection->access_token,
            true
        );

        if (
            isset($token['access_token']) &&
            isset($token['expires_at']) &&
            now()->timestamp < ($token['expires_at'] - 60)
        ) {
            return $token['access_token'];
        }

        if (!$connection->refresh_token) {
            throw new \Exception(
                'Google Calendar connection has no refresh token.'
            );
        }

        $response = Http::asForm()->post(
            'https://oauth2.googleapis.com/token',
            [
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'refresh_token' => $connection->refresh_token,
                'grant_type' => 'refresh_token',
            ]
        );

        if (!$response->successful()) {
            throw new \Exception(
                'Unable to refresh Google Calendar access token: ' .
                $response->body()
            );
        }

        $newToken = $response->json();

        $newToken['expires_at'] = now()->timestamp +
            ($newToken['expires_in'] ?? 3600);

        $connection->update([
            'access_token' => json_encode($newToken),
        ]);

        return $newToken['access_token'];
    }

    /**
     * Get Google Calendar events for a specific date.
     */
    public function getEventsForDate(
        GoogleCalendarConnection $connection,
        string $date
    ): array {
        $accessToken = $this->getAccessToken($connection);

        $timeMin = $date . 'T00:00:00+05:30';
        $timeMax = $date . 'T23:59:59+05:30';

        $response = Http::withToken($accessToken)->get(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            [
                'timeMin' => $timeMin,
                'timeMax' => $timeMax,
                'singleEvents' => 'true',
                'orderBy' => 'startTime',
            ]
        );

        if (!$response->successful()) {
            throw new \Exception(
                'Unable to read Google Calendar: ' .
                $response->body()
            );
        }

        return $response->json('items', []);
    }

    /**
     * Check whether the interviewer has at least
     * one free 60-minute period between 09:00 and 17:00.
     */
    public function checkAvailability(
        GoogleCalendarConnection $connection,
        string $date
    ): array {
        $events = $this->getEventsForDate(
            $connection,
            $date
        );

        $workStart = strtotime($date . ' 09:00:00');
        $workEnd = strtotime($date . ' 17:00:00');

        $busyPeriods = [];

        foreach ($events as $event) {

            // All-day event.
            if (
                isset($event['start']['date']) &&
                isset($event['end']['date'])
            ) {
                $busyPeriods[] = [
                    'start' => $workStart,
                    'end' => $workEnd,
                ];

                continue;
            }

            $start = $event['start']['dateTime'] ?? null;
            $end = $event['end']['dateTime'] ?? null;

            if (!$start || !$end) {
                continue;
            }

            $startTimestamp = strtotime($start);
            $endTimestamp = strtotime($end);

            $startTimestamp = max(
                $startTimestamp,
                $workStart
            );

            $endTimestamp = min(
                $endTimestamp,
                $workEnd
            );

            if ($startTimestamp < $endTimestamp) {
                $busyPeriods[] = [
                    'start' => $startTimestamp,
                    'end' => $endTimestamp,
                ];
            }
        }

        usort(
            $busyPeriods,
            fn ($a, $b) => $a['start'] <=> $b['start']
        );

        $current = $workStart;

        foreach ($busyPeriods as $period) {

            if (($period['start'] - $current) >= 3600) {
                return [
                    'available' => true,
                    'suggested_time' => date(
                        'H:i',
                        $current
                    ),
                ];
            }

            $current = max(
                $current,
                $period['end']
            );
        }

        if (($workEnd - $current) >= 3600) {
            return [
                'available' => true,
                'suggested_time' => date(
                    'H:i',
                    $current
                ),
            ];
        }

        return [
            'available' => false,
            'suggested_time' => null,
        ];
    }
}