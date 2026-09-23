<?php

namespace App\Http\Controllers;

use App\Models\Interview;
use App\Models\Application;
use App\Models\User;
use App\Models\InterviewFeedback;
use App\Services\GoogleCalendarService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\JobPosition;
use Illuminate\Support\Facades\DB;
use App\Mail\RecruitmentNotificationMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

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
    /*
     * If a vacancy already has a locked Interview 1 schedule,
     * make sure any newly eligible candidates receive an
     * Interview 1 record using that same locked schedule.
     */
    $vacancyIds = Application::where(
        'shortlisted_by_hiring_manager',
        true
    )
        ->pluck('job_position_id')
        ->unique()
        ->filter();

    $lockedVacancies = \App\Models\JobPosition::whereIn(
        'id',
        $vacancyIds
    )
        ->where(
            'interview_one_locked',
            true
        )
        ->get();

    foreach ($lockedVacancies as $vacancy) {
        $this->syncLockedInterviewSchedule(
            $vacancy,
            1
        );
    }

    $applications = Application::with([
        'candidate.user',
        'jobPosition',
        'cv',
        'interviews',
    ])
        ->where(
            'shortlisted_by_hiring_manager',
            true
        )
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
    /*
     * If Interview 2 has already been locked for a vacancy,
     * automatically assign the same Interview 2 setup to
     * candidates who are later moved into Interview 2.
     */
    $vacancyIds = Application::where(
        'shortlisted_by_hiring_manager',
        true
    )
        ->where(
            'selected_for_interview_two',
            true
        )
        ->pluck('job_position_id')
        ->unique()
        ->filter();

    $lockedVacancies = \App\Models\JobPosition::whereIn(
        'id',
        $vacancyIds
    )
        ->where(
            'interview_two_locked',
            true
        )
        ->get();

    foreach ($lockedVacancies as $vacancy) {
        $this->syncLockedInterviewSchedule(
            $vacancy,
            2
        );
    }

    $applications = Application::with([
        'candidate.user',
        'jobPosition',
        'cv',
        'interviews',
    ])
        ->where(
            'shortlisted_by_hiring_manager',
            true
        )
        ->where(
            'selected_for_interview_two',
            true
        )
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
    $validated['date'],
    $validated['start_time'] ?? null
);

           return response()->json([
    'user_id' => $user->id,
    'name' => $user->name,
    'position' => $user->position,
    'email' => $user->email,
    'connected' => true,
    'available' => $availability['available'],
    'suggested_time' =>
        $availability['suggested_time'] ?? null,
    'checked_start_time' =>
        $availability['checked_start_time'] ?? null,
    'checked_end_time' =>
        $availability['checked_end_time'] ?? null,
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
    public function store(
    Request $request,
    GoogleCalendarService $googleCalendar
) {
    $allowedStartTimes = [
        '09:00',
        '10:00',
        '11:00',
        '12:00',
        '13:00',
        '14:00',
        '15:00',
    ];

    $validated = $request->validate([
        'job_position_id' => [
            'required',
            'exists:job_positions,id',
        ],

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
            Rule::in($allowedStartTimes),
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

    $jobPosition = JobPosition::findOrFail(
        $validated['job_position_id']
    );

    $interviewNumber =
        (int) $validated['interview_number'];

    /*
     * =========================================================
     * CHECK WHETHER THIS VACANCY/STAGE IS ALREADY LOCKED
     * =========================================================
     */

    $lockedField =
        $interviewNumber === 1
            ? 'interview_one_locked'
            : 'interview_two_locked';

    $dateField =
        $interviewNumber === 1
            ? 'interview_one_date'
            : 'interview_two_date';

    $timeField =
        $interviewNumber === 1
            ? 'interview_one_time'
            : 'interview_two_time';

    if ($jobPosition->{$lockedField}) {

        /*
         * Once locked, nobody can change the setup.
         * The submitted values must match the DB.
         */

        if (
            (string) $jobPosition->{$dateField}
                !== (string) $validated['scheduled_date']
        ) {
            return response()->json([
                'message' =>
                    "Interview {$interviewNumber} is already locked for this vacancy.",
            ], 409);
        }

        $storedTime =
            substr(
                (string) $jobPosition->{$timeField},
                0,
                5
            );

        if (
            $storedTime !==
            $validated['scheduled_time']
        ) {
            return response()->json([
                'message' =>
                    "Interview {$interviewNumber} is already locked for this vacancy.",
            ], 409);
        }

        /*
         * The schedule already exists.
         * Make sure any newly eligible candidates
         * also receive the locked interview record.
         */
        $createdCount =
            $this->syncLockedInterviewSchedule(
                $jobPosition,
                $interviewNumber
            );

        return response()->json([
            'message' =>
                "Interview {$interviewNumber} schedule is already locked for this vacancy.",

            'locked' => true,

            'scheduled_count' =>
                $createdCount,

            'job_position' =>
                $jobPosition->fresh(),
        ], 200);
    }


    /*
     * =========================================================
     * INTERVIEW 1
     * =========================================================
     */

    if ($interviewNumber === 1) {

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

        $techLead = User::with([
            'role',
            'googleCalendarConnection',
        ])->findOrFail(
            $interviewOneData['tech_lead_id']
        );

        $seniorEngineer = User::with([
            'role',
            'googleCalendarConnection',
        ])->findOrFail(
            $interviewOneData['senior_engineer_id']
        );

        if (
            $techLead->position !==
            'Tech Lead'
        ) {
            return response()->json([
                'message' =>
                    'The selected Tech Lead account is invalid.',
            ], 422);
        }

        if (
            $seniorEngineer->position !==
            'Senior Software Engineer'
        ) {
            return response()->json([
                'message' =>
                    'The selected Senior Software Engineer account is invalid.',
            ], 422);
        }

        if (
            $techLead->role?->name !==
            'Interviewer' ||
            $seniorEngineer->role?->name !==
            'Interviewer'
        ) {
            return response()->json([
                'message' =>
                    'Both Interview 1 participants must have the Interviewer role.',
            ], 422);
        }

        /*
         * Re-check the exact 2-hour calendar block
         * on the server before locking the vacancy.
         */

        foreach ([
            $techLead,
            $seniorEngineer,
        ] as $participant) {

            $connection =
                $participant->googleCalendarConnection;

            if (!$connection) {
                return response()->json([
                    'message' =>
                        "{$participant->name} does not have Google Calendar connected.",
                ], 422);
            }

            $availability =
                $googleCalendar->checkAvailability(
                    $connection,
                    $validated['scheduled_date'],
                    $validated['scheduled_time']
                );

            if (
                ($availability['available'] ?? false)
                !== true
            ) {
                return response()->json([
                    'message' =>
                        "{$participant->name} is not available for the selected 2-hour interview block.",
                ], 422);
            }
        }


        /*
         * =====================================================
         * LOCK INTERVIEW 1 FOR THIS VACANCY
         * =====================================================
         */

        $jobPosition->interview_one_locked =
            true;

        $jobPosition->interview_one_date =
            $validated['scheduled_date'];

        $jobPosition->interview_one_time =
            $validated['scheduled_time'];

        $jobPosition->interview_one_tech_lead_id =
            $techLead->id;

        $jobPosition->interview_one_senior_engineer_id =
            $seniorEngineer->id;

        $jobPosition->save();


        /*
         * Create Interview 1 records for every
         * eligible candidate in this vacancy.
         */

        $createdCount =
            $this->syncLockedInterviewSchedule(
                $jobPosition->fresh(),
                1
            );

            $this->sendStaffInterviewEmail(
    $techLead,
    $jobPosition->fresh(),
    1
);

$this->sendStaffInterviewEmail(
    $seniorEngineer,
    $jobPosition->fresh(),
    1
);

        return response()->json([
            'message' =>
                'Interview 1 has been scheduled and locked for this vacancy.',

            'locked' => true,

            'scheduled_count' =>
                $createdCount,

            'job_position' =>
                $jobPosition->fresh(),
        ], 201);
    }


    /*
 * =========================================================
 * INTERVIEW 2
 * =========================================================
 */

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

$hrManager = User::with([
    'role',
    'googleCalendarConnection',
])->findOrFail(
    $interviewTwoData['hr_manager_id']
);

$hiringManager = User::with([
    'role',
    'googleCalendarConnection',
])->findOrFail(
    $interviewTwoData['hiring_manager_id']
);

if ($hrManager->position !== 'HR Manager') {
    return response()->json([
        'message' =>
            'The selected HR Manager account is invalid.',
    ], 422);
}

if ($hiringManager->position !== 'Hiring Manager') {
    return response()->json([
        'message' =>
            'The selected Hiring Manager account is invalid.',
    ], 422);
}



    /*
     * Exact 2-hour availability check.
     */

    foreach ([
        $hrManager,
        $hiringManager,
    ] as $participant) {

        $connection =
            $participant->googleCalendarConnection;

        if (!$connection) {
            return response()->json([
                'message' =>
                    "{$participant->name} does not have Google Calendar connected.",
            ], 422);
        }

        $availability =
            $googleCalendar->checkAvailability(
                $connection,
                $validated['scheduled_date'],
                $validated['scheduled_time']
            );

        if (
            ($availability['available'] ?? false)
            !== true
        ) {
            return response()->json([
                'message' =>
                    "{$participant->name} is not available for the selected 2-hour interview block.",
            ], 422);
        }
    }


    /*
     * =========================================================
     * LOCK INTERVIEW 2 FOR THIS VACANCY
     * =========================================================
     */

    $jobPosition->interview_two_locked =
        true;

    $jobPosition->interview_two_date =
        $validated['scheduled_date'];

    $jobPosition->interview_two_time =
        $validated['scheduled_time'];

    $jobPosition->interview_two_hr_manager_id =
        $hrManager->id;

    $jobPosition->interview_two_hiring_manager_id =
        $hiringManager->id;

    $jobPosition->save();


    /*
     * Create Interview 2 records for every candidate
     * already eligible for Interview 2.
     */

    $createdCount =
        $this->syncLockedInterviewSchedule(
            $jobPosition->fresh(),
            2
        );
        $this->sendStaffInterviewEmail(
    $hrManager,
    $jobPosition->fresh(),
    2
);

$this->sendStaffInterviewEmail(
    $hiringManager,
    $jobPosition->fresh(),
    2
);

    return response()->json([
        'message' =>
            'Interview 2 has been scheduled and locked for this vacancy.',

        'locked' => true,

        'scheduled_count' =>
            $createdCount,

        'job_position' =>
            $jobPosition->fresh(),
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
public function moveToInterviewTwo(
    Request $request
) {
    $validated = $request->validate([
        'application_id' =>
            'required|exists:applications,id',
    ]);

    $application = Application::with([
        'jobPosition',
    ])->findOrFail(
        $validated['application_id']
    );

    /*
     * Candidate becomes eligible for Interview 2.
     */
    $application->selected_for_interview_two = true;
    $application->save();


    /*
     * Moving to Interview 2 means Interview 1 passed.
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


    /*
     * IMPORTANT:
     *
     * If this vacancy already has a locked Interview 2
     * schedule, automatically create the candidate's
     * Interview 2 using the existing locked setup.
     */
    $autoScheduled = false;

    if (
        $application->jobPosition &&
        $application->jobPosition->interview_two_locked
    ) {
        $this->syncLockedInterviewSchedule(
            $application->jobPosition,
            2
        );

        $autoScheduled = true;
    }


    return response()->json([
        'message' =>
            $autoScheduled
                ? 'Candidate has passed Interview 1, moved to Interview 2, and assigned to the existing Interview 2 schedule.'
                : 'Candidate has passed Interview 1 and has been moved to Interview 2.',

        'application' =>
            $application->fresh([
                'jobPosition',
            ]),

        'auto_scheduled' =>
            $autoScheduled,
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
 * Get Interview 2 candidates assigned to the
 * current HR Manager, including any feedback
 * they have already submitted.
 */
public function myFeedbacks(
    Request $request
) {
    $userId = $request->user()->id;

    /*
     * Get Interview 2 interviews where this HR Manager
     * is the assigned HR participant.
     */
    $interviews = Interview::with([
        'application.candidate.user',
        'application.jobPosition',
        'application.cv',
        'techLead',
        'seniorEngineer',
        'hrManager',
        'hiringManager',
    ])
        ->where(
            'interview_number',
            2
        )
        ->where(
            'hr_manager_id',
            $userId
        )
        ->whereNotIn(
            'status',
            ['cancelled']
        )
        ->orderBy(
            'scheduled_date'
        )
        ->orderBy(
            'scheduled_time'
        )
        ->get();

    /*
     * Get feedback already submitted by this HR Manager
     * for these Interview 2 records.
     */
    $feedback = InterviewFeedback::where(
        'interviewer_id',
        $userId
    )
        ->whereIn(
            'interview_id',
            $interviews->pluck('id')
        )
        ->get()
        ->keyBy(
            'interview_id'
        );

    /*
     * Return every assigned Interview 2 candidate.
     * Feedback will be null until the HR submits it.
     */
    $results = $interviews->map(
        function ($interview) use ($feedback) {

            $savedFeedback =
                $feedback->get(
                    $interview->id
                );

            return [
                'id' =>
                    $interview->id,

                'interview' =>
                    $interview,

                'feedback' =>
                    $savedFeedback?->feedback,

                'feedback_id' =>
                    $savedFeedback?->id,
            ];
        }
    );

    return response()->json([
        'feedback' => $results,
    ]);
}

/**
 * Apply an already locked vacancy schedule to
 * every eligible candidate who does not yet have
 * an interview record for that stage.
 */
private function syncLockedInterviewSchedule(
    JobPosition $jobPosition,
    int $interviewNumber
): int {
    $createdCount = 0;


    /*
     * =========================================================
     * INTERVIEW 1 ELIGIBILITY
     * =========================================================
     */

    if ($interviewNumber === 1) {

        if (!$jobPosition->interview_one_locked) {
            return 0;
        }

        $applications = Application::where(
            'job_position_id',
            $jobPosition->id
        )
            ->where(
                'shortlisted_by_hiring_manager',
                true
            )
            ->get();

       foreach ($applications as $application) {

    $existing = Interview::where(
        'application_id',
        $application->id
    )
        ->where(
            'interview_number',
            1
        )
        ->first();

    if ($existing) {
        continue;
    }

    $interview = Interview::create([
        'application_id' =>
            $application->id,

        'interview_number' =>
            1,

        'tech_lead_id' =>
            $jobPosition->interview_one_tech_lead_id,

        'senior_engineer_id' =>
            $jobPosition->interview_one_senior_engineer_id,

        'scheduled_date' =>
            $jobPosition->interview_one_date,

        'scheduled_time' =>
            $jobPosition->interview_one_time,

        'status' =>
            'scheduled',
    ]);

    $this->sendCandidateInterviewEmail(
        $interview
    );

    $createdCount++;
}

return $createdCount;
        return $createdCount;
    }


    /*
     * =========================================================
     * INTERVIEW 2 ELIGIBILITY
     * =========================================================
     */

    if (!$jobPosition->interview_two_locked) {
        return 0;
    }

    $applications = Application::with([
        'interviews',
    ])
        ->where(
            'job_position_id',
            $jobPosition->id
        )
        ->where(
            'shortlisted_by_hiring_manager',
            true
        )
        ->where(
            'selected_for_interview_two',
            true
        )
        ->whereHas(
            'interviews',
            function ($query) {
                $query
                    ->where(
                        'interview_number',
                        1
                    )
                    ->where(
                        'status',
                        'passed'
                    );
            }
        )
        ->get();

    foreach ($applications as $application) {

        $existing = Interview::where(
            'application_id',
            $application->id
        )
            ->where(
                'interview_number',
                2
            )
            ->first();

        if ($existing) {
            continue;
        }

       $interview = Interview::create([
    'application_id' =>
        $application->id,

    'interview_number' =>
        2,

    'hr_manager_id' =>
        $jobPosition->interview_two_hr_manager_id,

    'hiring_manager_id' =>
        $jobPosition->interview_two_hiring_manager_id,

    'scheduled_date' =>
        $jobPosition->interview_two_date,

    'scheduled_time' =>
        $jobPosition->interview_two_time,

    'status' =>
        'scheduled',
]);

$this->sendCandidateInterviewEmail(
    $interview
);

$createdCount++;
    }

    return $createdCount;
}


/**
 * Get all interview feedback for a candidate/application.
 *
 * Used by HR Manager from the candidate profile.
 */
public function getCandidateFeedback(
    Request $request,
    $id
) {
    $application = Application::with([
        'interviews',
    ])->findOrFail($id);

    $interviewIds = $application->interviews
        ->pluck('id');

    $feedback = InterviewFeedback::with([
        'interviewer',
    ])
        ->whereIn(
            'interview_id',
            $interviewIds
        )
        ->orderBy(
            'created_at',
            'asc'
        )
        ->get();

    $results = $feedback->map(
        function ($item) use ($application) {

            $interview =
                $application->interviews
                    ->firstWhere(
                        'id',
                        $item->interview_id
                    );

            return [
                'id' =>
                    $item->id,

                'interview_id' =>
                    $item->interview_id,

                'interview_number' =>
                    $interview?->interview_number,

                'interview_status' =>
                    $interview?->status,

                'interviewer' =>
                    $item->interviewer,

                'feedback' =>
                    $item->feedback,

                'created_at' =>
                    $item->created_at,
            ];
        }
    );

    return response()->json([
        'feedback' => $results,
    ]);
}


/**
 * Send interview schedule email to a candidate.
 */
private function sendCandidateInterviewEmail(
    Interview $interview
): void {
    try {

        $interview->load([
            'application.candidate.user',
            'application.candidate',
            'application.jobPosition',
        ]);

        $application =
            $interview->application;

        $candidate =
            $application?->candidate;

        $candidateEmail =
            $candidate?->user?->email
            ?? $candidate?->email
            ?? $application?->candidate_email;

        if (!$candidateEmail) {
            Log::warning(
                'Candidate interview email skipped: no email address.',
                [
                    'application_id' =>
                        $application?->id,
                    'interview_id' =>
                        $interview->id,
                ]
            );

            return;
        }

        $candidateName =
            $candidate?->user?->name
            ?? $candidate?->name
            ?? 'Candidate';

        $position =
            $application?->jobPosition?->title
            ?? 'Job Position';

        $interviewNumber =
            (int) $interview->interview_number;

        Mail::to($candidateEmail)->send(
            new RecruitmentNotificationMail(
                "Interview {$interviewNumber} Scheduled - {$position}",

                "Your Interview {$interviewNumber} Has Been Scheduled",

                "Dear {$candidateName}, your Interview {$interviewNumber} for the {$position} position has been scheduled.",

                [
                    'Position' =>
                        $position,

                    'Interview' =>
                        "Interview {$interviewNumber}",

                    'Date' =>
                        $interview->scheduled_date,

                    'Time' =>
                        $interview->scheduled_time,

                    'Status' =>
                        'Scheduled',
                ]
            )
        );

    } catch (\Throwable $e) {

        Log::error(
            'Failed to send candidate interview email.',
            [
                'interview_id' =>
                    $interview->id,

                'error' =>
                    $e->getMessage(),
            ]
        );
    }
}


/**
 * Notify an interviewer that an interview stage
 * has been scheduled for a vacancy.
 */
private function sendStaffInterviewEmail(
    User $participant,
    JobPosition $jobPosition,
    int $interviewNumber
): void {
    try {

        if (!$participant->email) {
            Log::warning(
                'Staff interview email skipped: no email address.',
                [
                    'user_id' =>
                        $participant->id,
                ]
            );

            return;
        }

        $interviews = Interview::with([
            'application.candidate.user',
            'application.candidate',
        ])
            ->whereHas(
                'application',
                function ($query) use (
                    $jobPosition
                ) {
                    $query->where(
                        'job_position_id',
                        $jobPosition->id
                    );
                }
            )
            ->where(
                'interview_number',
                $interviewNumber
            )
            ->where(
                'status',
                'scheduled'
            )
            ->get();

        $candidateNames =
            $interviews
                ->map(function ($interview) {

                    return
                        $interview->application
                            ?->candidate
                            ?->user
                            ?->name
                        ?? $interview->application
                            ?->candidate
                            ?->name
                        ?? 'Candidate';

                })
                ->unique()
                ->values()
                ->implode(', ');

        if (!$candidateNames) {
            $candidateNames = 'Assigned candidates';
        }

        Mail::to($participant->email)->send(
                new RecruitmentNotificationMail(
                "Interview {$interviewNumber} Scheduled - {$jobPosition->title}",

                "Interview {$interviewNumber} Assignment",

                "You have been assigned to Interview {$interviewNumber} for the {$jobPosition->title} vacancy.",

                [
                    'Vacancy' =>
                        $jobPosition->title,

                    'Interview' =>
                        "Interview {$interviewNumber}",

                    'Candidates' =>
                        $candidateNames,

                    'Date' =>
                        $interviewNumber === 1
                            ? $jobPosition->interview_one_date
                            : $jobPosition->interview_two_date,

                    'Time' =>
                        $interviewNumber === 1
                            ? $jobPosition->interview_one_time
                            : $jobPosition->interview_two_time,

                    'Your Role' =>
                        $participant->position,
                ]
            )
        );

    } catch (\Throwable $e) {

        Log::error(
            'Failed to send interviewer interview email.',
            [
                'user_id' =>
                    $participant->id,

                'job_position_id' =>
                    $jobPosition->id,

                'interview_number' =>
                    $interviewNumber,

                'error' =>
                    $e->getMessage(),
            ]
        );
    }
}
}