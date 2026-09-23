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
    /**
 * Check interviewer availability.
 *
 * Without a start time:
 * - Checks whether the interviewer has at least one
 *   free 2-hour block between 09:00 and 17:00.
 * - Returns the first valid start time from:
 *   09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00
 *
 * With a start time:
 * - Checks the exact 2-hour block beginning at that time.
 */
public function checkAvailability(
    GoogleCalendarConnection $connection,
    string $date,
    ?string $startTime = null
): array {
    $events = $this->getEventsForDate(
        $connection,
        $date
    );

    $timezone = new \DateTimeZone('Asia/Colombo');

    $workStart = new \DateTimeImmutable(
        $date . ' 09:00:00',
        $timezone
    );

    $workEnd = new \DateTimeImmutable(
        $date . ' 17:00:00',
        $timezone
    );

    $allowedStartTimes = [
        '09:00',
        '10:00',
        '11:00',
        '12:00',
        '13:00',
        '14:00',
        '15:00',
    ];

    /*
    |--------------------------------------------------------------------------
    | Validate selected start time
    |--------------------------------------------------------------------------
    */

    if (
        $startTime !== null &&
        !in_array($startTime, $allowedStartTimes, true)
    ) {
        throw new \InvalidArgumentException(
            'Interview start time must be between 09:00 and 15:00 in one-hour intervals.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Build busy periods
    |--------------------------------------------------------------------------
    */

    $busyPeriods = [];

    foreach ($events as $event) {

        /*
        | Ignore cancelled events.
        */
        if (($event['status'] ?? null) === 'cancelled') {
            continue;
        }

        /*
        | Transparent events do not block calendar availability.
        */
        if (($event['transparency'] ?? null) === 'transparent') {
            continue;
        }

        /*
        | All-day event.
        */
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

        try {
            $eventStart = new \DateTimeImmutable(
                $start
            );

            $eventEnd = new \DateTimeImmutable(
                $end
            );
        } catch (\Throwable $e) {
            continue;
        }

        /*
        | Only the part inside the working day matters.
        */
        if ($eventStart < $workStart) {
            $eventStart = $workStart;
        }

        if ($eventEnd > $workEnd) {
            $eventEnd = $workEnd;
        }

        if ($eventStart < $eventEnd) {
            $busyPeriods[] = [
                'start' => $eventStart,
                'end' => $eventEnd,
            ];
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Sort busy periods
    |--------------------------------------------------------------------------
    */

    usort(
        $busyPeriods,
        fn ($a, $b) =>
            $a['start']->getTimestamp()
            <=>
            $b['start']->getTimestamp()
    );

    /*
    |--------------------------------------------------------------------------
    | Helper: check one exact 2-hour block
    |--------------------------------------------------------------------------
    */

    $isFree = function (
        \DateTimeImmutable $blockStart,
        \DateTimeImmutable $blockEnd
    ) use ($busyPeriods): bool {

        foreach ($busyPeriods as $period) {

            /*
            | Two ranges overlap when:
            |
            | blockStart < busyEnd
            | AND
            | blockEnd > busyStart
            |
            */
            if (
                $blockStart < $period['end'] &&
                $blockEnd > $period['start']
            ) {
                return false;
            }
        }

        return true;
    };

    /*
    |--------------------------------------------------------------------------
    | EXACT TIME CHECK
    |--------------------------------------------------------------------------
    */

    if ($startTime !== null) {

        $blockStart = new \DateTimeImmutable(
            $date . ' ' . $startTime . ':00',
            $timezone
        );

        $blockEnd = $blockStart->modify('+2 hours');

        /*
        | Safety check:
        | 3:00 PM → 5:00 PM is the latest allowed block.
        */
        if ($blockEnd > $workEnd) {
            return [
                'available' => false,
                'suggested_time' => null,
            ];
        }

        $available = $isFree(
            $blockStart,
            $blockEnd
        );

        return [
            'available' => $available,
            'suggested_time' =>
                $available
                    ? $startTime
                    : null,
            'checked_start_time' =>
                $startTime,
            'checked_end_time' =>
                $blockEnd->format('H:i'),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | DATE-LEVEL CHECK
    |--------------------------------------------------------------------------
    |
    | Find the first available 2-hour block using
    | the allowed one-hour starting times.
    |--------------------------------------------------------------------------
    */

    foreach ($allowedStartTimes as $candidateTime) {

        $blockStart = new \DateTimeImmutable(
            $date . ' ' . $candidateTime . ':00',
            $timezone
        );

        $blockEnd = $blockStart->modify('+2 hours');

        if (
            $blockEnd <= $workEnd &&
            $isFree($blockStart, $blockEnd)
        ) {
            return [
                'available' => true,
                'suggested_time' => $candidateTime,
            ];
        }
    }

    return [
        'available' => false,
        'suggested_time' => null,
    ];
}
}