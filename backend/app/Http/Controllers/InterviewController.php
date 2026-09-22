<?php

namespace App\Http\Controllers;

use App\Models\Interview;
use App\Models\Application;
use App\Models\User;
use App\Models\InterviewFeedback;
use App\Services\GoogleCalendarService;
use Illuminate\Http\Request;

class InterviewController extends Controller
{
    /**
     * Get candidates available for Interview 1.
     *
     * These are candidates who were shortlisted
     * by the Hiring Manager.
     */
    public function interviewOneCandidates(Request $request)
    {
        $applications = Application::with([
            'candidate.user',
            'jobPosition',
            'cv',
            'interviews',
        ])
            ->where('shortlisted_by_hiring_manager', true)
            ->whereHas('jobPosition')
            ->get();

        return response()->json([
            'applications' => $applications,
        ]);
    }

    /**
     * Get candidates available for Interview 2.
     *
     * Only candidates who:
     * 1. Were shortlisted by the Hiring Manager
     * 2. Were manually moved to Interview 2 by HR
     * 3. Passed Interview 1
     */
   public function interviewTwoCandidates(Request $request)
{
    $applications = Application::with([
        'candidate.user',
        'jobPosition',
        'cv',
        'interviews',
    ])
        ->where('shortlisted_by_hiring_manager', true)
        ->where('selected_for_interview_two', true)
        ->whereHas('jobPosition')
        ->get();

    return response()->json([
        'applications' => $applications,
    ]);
}
    /**
     * Get interviewer accounts.
     *
     * These are staff members who can participate
     * in interviews.
     */
    public function interviewers(Request $request)
    {
        $interviewers = User::with([
            'role',
            'googleCalendarConnection',
        ])
            ->whereIn('position', [
                'Tech Lead',
                'Senior Software Engineer',
                'HR Manager',
                'Hiring Manager',
            ])
            ->get();

        return response()->json([
            'interviewers' => $interviewers,
        ]);
    }

    /**
     * Check an individual staff member's Google Calendar availability.
     */
    public function interviewerAvailability(
        Request $request,
        GoogleCalendarService $googleCalendar
    ) {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date_format:Y-m-d',
        ]);

        $user = User::with([
            'role',
            'googleCalendarConnection',
        ])->findOrFail($validated['user_id']);

        $allowedPositions = [
            'Tech Lead',
            'Senior Software Engineer',
            'HR Manager',
            'Hiring Manager',
        ];

        if (!in_array($user->position, $allowedPositions, true)) {
            return response()->json([
                'message' => 'This staff member is not an interview participant.',
            ], 422);
        }

        $connection = $user->googleCalendarConnection;

        if (!$connection) {
            return response()->json([
                'user_id' => $user->id,
                'name' => $user->name,
                'position' => $user->position,
                'email' => $user->email,
                'connected' => false,
                'available' => false,
                'suggested_time' => null,
                'message' => 'Google Calendar is not connected.',
            ]);
        }

        try {
            $availability = $googleCalendar->checkAvailability(
                $connection,
                $validated['date']
            );

            return response()->json([
                'user_id' => $user->id,
                'name' => $user->name,
                'position' => $user->position,
                'email' => $user->email,
                'connected' => true,
                'available' => $availability['available'],
                'suggested_time' => $availability['suggested_time'],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'user_id' => $user->id,
                'name' => $user->name,
                'position' => $user->position,
                'email' => $user->email,
                'connected' => true,
                'available' => false,
                'suggested_time' => null,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Schedule an interview.
     *
     * Interview 1:
     * - Tech Lead
     * - Senior Software Engineer
     *
     * Interview 2:
     * - HR Manager
     * - Hiring Manager
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'application_id' => 'required|exists:applications,id',

            'interview_number' => [
                'required',
                'integer',
                'in:1,2',
            ],

            'scheduled_date' => [
                'required',
                'date',
            ],

            'scheduled_time' => [
                'required',
                'date_format:H:i',
            ],

            'meeting_link' => [
                'nullable',
                'url',
            ],

            'notes' => [
                'nullable',
                'string',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Make sure the interview does not already exist
        |--------------------------------------------------------------------------
        */

        $existingInterview = Interview::where(
            'application_id',
            $validated['application_id']
        )
            ->where(
                'interview_number',
                $validated['interview_number']
            )
            ->first();

        if ($existingInterview) {
            return response()->json([
                'message' => 'This interview has already been scheduled for this candidate.',
            ], 409);
        }

        /*
        |--------------------------------------------------------------------------
        | INTERVIEW 1
        |--------------------------------------------------------------------------
        */

        if ($validated['interview_number'] == 1) {

            $interviewOneData = $request->validate([
                'tech_lead_id' => [
                    'required',
                    'exists:users,id',
                ],

                'senior_engineer_id' => [
                    'required',
                    'exists:users,id',
                    'different:tech_lead_id',
                ],
            ]);

            $techLead = User::with('role')
                ->findOrFail($interviewOneData['tech_lead_id']);

            $seniorEngineer = User::with('role')
                ->findOrFail($interviewOneData['senior_engineer_id']);

            if ($techLead->position !== 'Tech Lead') {
                return response()->json([
                    'message' => 'The selected Tech Lead account is invalid.',
                ], 422);
            }

            if ($seniorEngineer->position !== 'Senior Software Engineer') {
                return response()->json([
                    'message' => 'The selected Senior Software Engineer account is invalid.',
                ], 422);
            }

            if (
                $techLead->role?->name !== 'Interviewer' ||
                $seniorEngineer->role?->name !== 'Interviewer'
            ) {
                return response()->json([
                    'message' => 'Both Interview 1 participants must have the Interviewer role.',
                ], 422);
            }

            $interview = Interview::create([
                'application_id' => $validated['application_id'],
                'interview_number' => 1,
                'tech_lead_id' => $techLead->id,
                'senior_engineer_id' => $seniorEngineer->id,
                'scheduled_date' => $validated['scheduled_date'],
                'scheduled_time' => $validated['scheduled_time'],
                'status' => 'scheduled',
                'meeting_link' => $validated['meeting_link'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | INTERVIEW 2
        |--------------------------------------------------------------------------
        */

        else {

            $interviewTwoData = $request->validate([
                'hr_manager_id' => [
                    'required',
                    'exists:users,id',
                ],

                'hiring_manager_id' => [
                    'required',
                    'exists:users,id',
                    'different:hr_manager_id',
                ],
            ]);

            $application = Application::findOrFail(
                $validated['application_id']
            );

            if (!$application->selected_for_interview_two) {
                return response()->json([
                    'message' => 'This candidate has not been moved to Interview 2.',
                ], 422);
            }

            $interviewOne = Interview::where(
                'application_id',
                $application->id
            )
                ->where('interview_number', 1)
                ->first();

            if (!$interviewOne) {
                return response()->json([
                    'message' => 'Interview 1 must be scheduled before Interview 2.',
                ], 422);
            }

            if ($interviewOne->status !== 'passed') {
                return response()->json([
                    'message' => 'The candidate must pass Interview 1 before Interview 2 can be scheduled.',
                ], 422);
            }

            $hrManager = User::with('role')
                ->findOrFail($interviewTwoData['hr_manager_id']);

            $hiringManager = User::with('role')
                ->findOrFail($interviewTwoData['hiring_manager_id']);

            if ($hrManager->position !== 'HR Manager') {
                return response()->json([
                    'message' => 'The selected HR Manager account is invalid.',
                ], 422);
            }

            if ($hiringManager->position !== 'Hiring Manager') {
                return response()->json([
                    'message' => 'The selected Hiring Manager account is invalid.',
                ], 422);
            }

            $interview = Interview::create([
                'application_id' => $validated['application_id'],
                'interview_number' => 2,
                'hr_manager_id' => $hrManager->id,
                'hiring_manager_id' => $hiringManager->id,
                'scheduled_date' => $validated['scheduled_date'],
                'scheduled_time' => $validated['scheduled_time'],
                'status' => 'scheduled',
                'meeting_link' => $validated['meeting_link'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Load relationships
        |--------------------------------------------------------------------------
        */

        $interview->load([
            'application.candidate.user',
            'application.jobPosition',
        ]);

        return response()->json([
            'message' => 'Interview scheduled successfully.',
            'interview' => $interview,
        ], 201);
    }

    /**
     * Get all scheduled interviews.
     */
    public function index(Request $request)
    {
        $interviews = Interview::with([
            'application.candidate.user',
            'application.jobPosition',
            'techLead',
            'seniorEngineer',
            'hrManager',
            'hiringManager',
        ])
            ->orderBy('scheduled_date')
            ->orderBy('scheduled_time')
            ->get();

        return response()->json([
            'interviews' => $interviews,
        ]);
    }

    /**
     * Update interview status.
     *
     * Used later by Interviewers after the interview.
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => [
                'required',
                'in:scheduled,completed,passed,rejected,cancelled',
            ],
        ]);

        $interview = Interview::find($id);

        if (!$interview) {
            return response()->json([
                'message' => 'Interview not found.',
            ], 404);
        }

        $interview->update([
            'status' => $validated['status'],
        ]);

        return response()->json([
            'message' => 'Interview status updated successfully.',
            'interview' => $interview,
        ]);
    }

    /**
     * Manually move a candidate from Interview 1 to Interview 2.
     *
     * This decision is stored permanently in the database.
     */
    /**
 * Move a candidate from Interview 1 to Interview 2.
 */
/**
 * Move a candidate from Interview 1 to Interview 2.
 *
 * Moving the candidate to Interview 2 also marks
 * Interview 1 as passed.
 */
public function moveToInterviewTwo(Request $request)
{
    $validated = $request->validate([
        'application_id' => 'required|exists:applications,id',
    ]);

    $application = Application::findOrFail(
        $validated['application_id']
    );

    /*
     * Mark the candidate as eligible for Interview 2.
     */
    $application->selected_for_interview_two = true;
    $application->save();

    /*
     * Moving the candidate to Interview 2 means
     * Interview 1 has been passed.
     */
    Interview::where(
        'application_id',
        $application->id
    )
        ->where(
            'interview_number',
            1
        )
        ->update([
            'status' => 'passed',
        ]);

    return response()->json([
        'message' =>
            'Candidate has passed Interview 1 and has been moved to Interview 2.',

        'application' =>
            $application,
    ]);
}
private function ensureInterviewParticipant(
    Interview $interview,
    User $user
): void {
    $assigned =
        (int) $interview->tech_lead_id === (int) $user->id ||
        (int) $interview->senior_engineer_id === (int) $user->id ||
        (int) $interview->hr_manager_id === (int) $user->id ||
        (int) $interview->hiring_manager_id === (int) $user->id;

    if (!$assigned) {
        abort(
            response()->json([
                'message' =>
                    'You are not assigned to this interview.',
            ], 403)
        );
    }
}

public function myInterviews(Request $request)
{
    $user = $request->user();

    $interviews = Interview::with([
        'application.candidate.user',
        'application.jobPosition',
        'application.cv',
        'techLead',
        'seniorEngineer',
    ])
        ->where(function ($query) use ($user) {
            $query
                ->where(
                    'tech_lead_id',
                    $user->id
                )
                ->orWhere(
                    'senior_engineer_id',
                    $user->id
                );
        })
        ->orderBy('scheduled_date')
        ->orderBy('scheduled_time')
        ->get();

    return response()->json([
        'interviews' => $interviews,
    ]);
}
public function getMyFeedback(
    Request $request,
    $id
) {
    $interview = Interview::findOrFail($id);

    $this->ensureInterviewParticipant(
        $interview,
        $request->user()
    );

    $feedback = InterviewFeedback::where(
        'interview_id',
        $interview->id
    )
        ->where(
            'interviewer_id',
            $request->user()->id
        )
        ->first();

    return response()->json([
        'feedback' => $feedback,
    ]);
}

public function storeMyFeedback(
    Request $request,
    $id
) {
    $validated = $request->validate([
        'feedback' => [
            'required',
            'string',
            'max:5000',
        ],
    ]);

    $interview = Interview::findOrFail($id);

    $this->ensureInterviewParticipant(
        $interview,
        $request->user()
    );

    $existing = InterviewFeedback::where(
        'interview_id',
        $interview->id
    )
        ->where(
            'interviewer_id',
            $request->user()->id
        )
        ->first();

    if ($existing) {
        return response()->json([
            'message' =>
                'Feedback has already been submitted for your interview slot.',
            'feedback' => $existing,
        ], 409);
    }

    $feedback = InterviewFeedback::create([
        'interview_id' =>
            $interview->id,

        'interviewer_id' =>
            $request->user()->id,

        'feedback' =>
            $validated['feedback'],
    ]);

    return response()->json([
        'message' =>
            'Interview feedback submitted successfully.',

        'feedback' =>
            $feedback,
    ], 201);
}

/**
 * Get all feedback submitted for an interview.
 *
 * Used by the Hiring Manager to review feedback
 * from all interview participants.
 */
public function getAllFeedback(
    Request $request,
    $id
) {
    $interview = Interview::findOrFail($id);

    $feedback = InterviewFeedback::with([
        'interviewer',
    ])
        ->where(
            'interview_id',
            $interview->id
        )
        ->orderBy(
            'created_at',
            'asc'
        )
        ->get();

    return response()->json([
        'feedback' => $feedback,
    ]);
}

/**
 * Get feedback submitted by the current HR Manager.
 */
public function myFeedbacks(
    Request $request
) {
    $feedback = InterviewFeedback::with([
        'interview.application.candidate.user',
        'interview.application.jobPosition',
        'interviewer',
    ])
        ->where(
            'interviewer_id',
            $request->user()->id
        )
        ->orderByDesc(
            'created_at'
        )
        ->get();

    return response()->json([
        'feedback' => $feedback,
    ]);
}

}