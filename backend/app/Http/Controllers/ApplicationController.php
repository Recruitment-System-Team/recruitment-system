<?php

namespace App\Http\Controllers;

use App\Models\Application;

use Illuminate\Http\Request;
use App\Mail\RecruitmentNotificationMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ApplicationController extends Controller
{
    /**
     * Get applications.
     *
     * Candidates only see their own applications.
     * Staff users can see all applications.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $query = Application::with([
            'candidate.user',
            'jobPosition',
            'cv'
        ]);

        if ($user->candidate) {
            $query->where('candidate_id', $user->candidate->id);
        }

        $applications = $query
            ->latest()
            ->get();

        return response()->json([
            'applications' => $applications
        ]);
    }

    /**
     * Create a new application.
     *
     * The candidate is automatically determined from
     * the currently authenticated user.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $candidate = $user->candidate;

        if (!$candidate) {
            return response()->json([
                'message' => 'No candidate profile is associated with this account.'
            ], 403);
        }

        $validated = $request->validate([
            'job_position_id' => [
                'required',
                'exists:job_positions,id',
            ],
            'cv_id' => [
                'nullable',
                'exists:cvs,id',
            ],
        ]);

        /**
         * Make sure the selected CV belongs to the candidate.
         */
        $cv = null;

        if (!empty($validated['cv_id'])) {
            $cv = $candidate->cvs()
                ->where('id', $validated['cv_id'])
                ->first();

            if (!$cv) {
                return response()->json([
                    'message' => 'The selected CV does not belong to your account.'
                ], 403);
            }
        }

        /**
         * Prevent duplicate applications.
         */
        $existingApplication = Application::where(
            'candidate_id',
            $candidate->id
        )
            ->where(
                'job_position_id',
                $validated['job_position_id']
            )
            ->first();

        if ($existingApplication) {
            return response()->json([
                'message' => 'You have already applied for this vacancy.',
                'application' => $existingApplication
            ], 409);
        }

        /**
         * Create application.
         */
        $application = Application::create([
            'candidate_id' => $candidate->id,
            'job_position_id' => $validated['job_position_id'],
            'cv_id' => $validated['cv_id'] ?? null,
            'status' => 'new',
            'applied_at' => now(),
        ]);

        $application->load([
            'candidate.user',
            'jobPosition',
            'cv'
        ]);
        

        /**
         * Automatically evaluate processed CV.
         */
        if (
            $application->cv &&
            $application->cv->extracted_text &&
            $application->cv->processing_status === 'processed'
        ) {
            $this->runMatching($application);

            $application->refresh();

           /**
 * Automatically reject candidates below 60%.
 */
if (
    $application->match_score !== null &&
    $application->match_score < 60
) {
    $application->update([
        'status' => 'rejected'
    ]);

    $application->refresh();

    $application->load([
        'candidate.user',
        'candidate',
        'jobPosition',
        'cv'
    ]);

    $this->sendApplicationStatusEmail(
        $application,
        'rejected'
    );
} else {
    $application->refresh();

    $application->load([
        'candidate.user',
        'candidate',
        'jobPosition',
        'cv'
    ]);
}
        }

        return response()->json([
            'message' => 'Application created successfully.',
            'application' => $application,
        ], 201);
    }

    /**
     * Get a single application.
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $application = Application::with([
            'candidate.user',
            'jobPosition',
            'cv'
        ])->findOrFail($id);

        /**
         * Candidates can only view their own application.
         */
        if (
            $user->candidate &&
            $application->candidate_id !== $user->candidate->id
        ) {
            return response()->json([
                'message' => 'You are not authorised to view this application.'
            ], 403);
        }

        return response()->json([
            'application' => $application
        ]);
    }

    /**
     * Update application status.
     */
   public function updateStatus(Request $request, $id)
{
    $validated = $request->validate([
        'status' =>
            'required|string|in:new,screening,shortlisted,interview,selected,rejected'
    ]);

    $application =
        Application::findOrFail($id);

    $oldStatus =
        $application->status;

    $newStatus =
        $validated['status'];

    $application->update([
        'status' =>
            $newStatus
    ]);

    $application->load([
        'candidate.user',
        'candidate',
        'jobPosition',
        'cv'
    ]);

    /*
     * Only send an email when the candidate actually
     * enters Selected or Rejected.
     *
     * This prevents duplicate emails when the same
     * status is saved again.
     */
    if (
        $oldStatus !== $newStatus &&
        in_array(
            $newStatus,
            ['selected', 'rejected'],
            true
        )
    ) {
        $this->sendApplicationStatusEmail(
            $application,
            $newStatus
        );
    }

    return response()->json([
        'message' =>
            'Application status updated successfully.',

        'application' =>
            $application
    ]);
}


    /**
 * Send top candidates to Hiring Manager for review.
 *
 * POST /api/applications/send-to-hiring-manager
 */
public function sendToHiringManager(Request $request)
{
    $validated = $request->validate([
        'job_position_id' => 'required|exists:job_positions,id',
    ]);

    $applications = Application::where(
        'job_position_id',
        $validated['job_position_id']
    )
        ->where('match_score', '>=', 60)
        ->where('status', '!=', 'rejected')
        ->orderByDesc('match_score')
        ->limit(5)
        ->get();

    if ($applications->isEmpty()) {
        return response()->json([
            'message' => 'No eligible candidates were found to send for review.'
        ], 404);
    }

    $applications->each(function ($application) {
        $application->update([
            'sent_to_hiring_manager' => true,
        ]);
    });

    $applications->load([
        'candidate.user',
        'jobPosition',
        'cv'
    ]);

    return response()->json([
        'message' => 'Top candidates have been sent to the Hiring Manager for review.',
        'applications' => $applications,
    ]);
}


    /**
     * Manually evaluate an application.
     *
     * POST /api/applications/{id}/evaluate
     */
    public function evaluate($id)
    {
        $application = Application::with([
            'candidate.user',
            'jobPosition',
            'cv'
        ])->findOrFail($id);

        if (!$application->cv) {
            return response()->json([
                'message' => 'This application does not have a CV attached.'
            ], 422);
        }

        if (
            !$application->cv->extracted_text ||
            $application->cv->processing_status !== 'processed'
        ) {
            return response()->json([
                'message' => 'The CV has not been processed yet. Please process the CV before evaluating the application.'
            ], 422);
        }

        $matching = $this->runMatching($application);

        $application->refresh();

        /**
 * Apply the automatic screening rule.
 *
 * Candidates scoring below 60% are automatically rejected.
 * Candidates scoring 60% or above remain under review
 * for manual shortlisting.
 */
if ($application->match_score !== null) {
    if ($application->match_score < 60) {
        $application->update([
            'status' => 'rejected'
        ]);
    } else {
        $application->update([
            'status' => 'under_review'
        ]);
    }
}

        $application->refresh();

        $application->load([
            'candidate.user',
            'jobPosition',
            'cv'
        ]);

        return response()->json([
            'message' => 'Application evaluated successfully.',
            'application' => $application,
            'matching' => $matching
        ]);
    }
    /**
 * Send an automatic email when an application
 * becomes selected or rejected.
 */
private function sendApplicationStatusEmail(
    Application $application,
    string $status
): void {
    try {

        $application->load([
            'candidate.user',
            'candidate',
            'jobPosition',
        ]);

        $candidate =
            $application->candidate;

        $candidateEmail =
            $candidate?->user?->email
            ?? $candidate?->email
            ?? $application->candidate_email;

        if (!$candidateEmail) {

            Log::warning(
                'Application status email skipped: no candidate email.',
                [
                    'application_id' =>
                        $application->id,

                    'status' =>
                        $status,
                ]
            );

            return;
        }

        $candidateName =
            $candidate?->user?->name
            ?? $candidate?->name
            ?? 'Candidate';

        $position =
            $application->jobPosition?->title
            ?? 'Job Position';


        /*
         * ---------------------------------------------------------
         * SELECTED
         * ---------------------------------------------------------
         */

        if ($status === 'selected') {

            Mail::to($candidateEmail)->send(
                new RecruitmentNotificationMail(
                    "Congratulations - Selected for {$position}",

                    'Congratulations! You Have Been Selected',

                    "Dear {$candidateName}, we are pleased to inform you that you have been selected for the {$position} position.",

                    [
                        'Position' =>
                            $position,

                        'Application Status' =>
                            'Selected',
                    ]
                )
            );

            return;
        }


        /*
         * ---------------------------------------------------------
         * REJECTED
         * ---------------------------------------------------------
         */

        if ($status === 'rejected') {

            Mail::to($candidateEmail)->send(
                new RecruitmentNotificationMail(
                    "Application Update - {$position}",

                    'Application Update',

                    "Dear {$candidateName}, thank you for your interest in the {$position} position. After reviewing your application, we will not be progressing with your application at this stage.",

                    [
                        'Position' =>
                            $position,

                        'Application Status' =>
                            'Rejected',
                    ]
                )
            );
        }

    } catch (\Throwable $e) {

        /*
         * Email failure should not break the recruitment action.
         */
        Log::error(
            'Failed to send application status email.',
            [
                'application_id' =>
                    $application->id,

                'status' =>
                    $status,

                'error' =>
                    $e->getMessage(),
            ]
        );
    }
}

    /**
     * Run CV matching.
     *
     * Weighting:
     *
     * Responsibilities = 30%
     * Required Skills  = 25%
     * Experience       = 20%
     * Relevance        = 15%
     * Education        = 10%
     *
     * Total = 100%
     */
    private function runMatching(Application $application): array
    {
        if (!$application->cv || !$application->jobPosition) {
            throw new \RuntimeException(
                'A CV and job position are required for matching.'
            );
        }

        $cvText = $this->normaliseText(
            $application->cv->extracted_text ?? ''
        );

        $job = $application->jobPosition;

        $title = $this->normaliseText(
            $job->title ?? ''
        );

        $department = $this->normaliseText(
            $job->department ?? ''
        );

        $description = $this->fieldToText(
            $job->description ?? ''
        );

        $responsibilitiesText = $this->fieldToText(
            $job->responsibilities ?? ''
        );

        /**
         * Some versions of the database may contain
         * required_skills and desirable_skills columns.
         *
         * We check safely so this controller also works
         * if those columns are not present.
         */
        $requiredSkillsText = '';

        if (array_key_exists('required_skills', $job->getAttributes())) {
            $requiredSkillsText = $this->fieldToText(
                $job->getAttribute('required_skills')
            );
        }

        $desirableSkillsText = '';

        if (array_key_exists('desirable_skills', $job->getAttributes())) {
            $desirableSkillsText = $this->fieldToText(
                $job->getAttribute('desirable_skills')
            );
        }

        /**
         * General job text.
         */
        $jobText = $this->normaliseText(
            implode(' ', [
                $title,
                $department,
                $description,
                $responsibilitiesText,
                $requiredSkillsText,
                $desirableSkillsText
            ])
        );

        /*
        |--------------------------------------------------------------------------
        | 1. Skill groups
        |--------------------------------------------------------------------------
        |
        | Each skill has related terms.
        |
        | Example:
        |
        | React:
        | react
        | react.js
        | reactjs
        |
        | This prevents the matcher from treating every wording
        | variation as a completely different skill.
        |
        */

        $skillGroups = $this->getSkillGroups();

        /*
        |--------------------------------------------------------------------------
        | 2. Determine job skills
        |--------------------------------------------------------------------------
        */

        $jobSkills = [];
        $requiredJobSkills = [];
        $desirableJobSkills = [];

        foreach ($skillGroups as $canonicalSkill => $terms) {
            $foundInRequiredArea =
                $this->containsAnyTerm(
                    $this->normaliseText(
                        implode(' ', [
                            $title,
                            $department,
                            $description,
                            $responsibilitiesText,
                            $requiredSkillsText
                        ])
                    ),
                    $terms
                );

            $foundInDesirableArea =
                $this->containsAnyTerm(
                    $this->normaliseText(
                        $desirableSkillsText
                    ),
                    $terms
                );

            if ($foundInRequiredArea) {
                $requiredJobSkills[] = $canonicalSkill;
                $jobSkills[] = $canonicalSkill;
            } elseif ($foundInDesirableArea) {
                $desirableJobSkills[] = $canonicalSkill;
                $jobSkills[] = $canonicalSkill;
            }
        }

        $jobSkills = array_values(
            array_unique($jobSkills)
        );

        /*
        |--------------------------------------------------------------------------
        | 3. Match skills
        |--------------------------------------------------------------------------
        */

        $matchedSkills = [];
        $skillMatches = [];

        foreach ($jobSkills as $skill) {
            $termsToCheck = $skillGroups[$skill] ?? [$skill];

            foreach ($termsToCheck as $term) {
                if ($this->containsTerm($cvText, $term)) {
                    $matchedSkills[] = $skill;

                    $skillMatches[] = [
                        'required_skill' => $skill,
                        'matched_term' => $term,
                        'importance' => in_array(
                            $skill,
                            $desirableJobSkills,
                            true
                        )
                            ? 'desirable'
                            : 'required'
                    ];

                    break;
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | 4. Skill score
        |--------------------------------------------------------------------------
        |
        | Required skills carry full weight.
        | Desirable skills carry half weight.
        |
        */

        $totalSkillWeight = 0;
        $matchedSkillWeight = 0;

        foreach ($jobSkills as $skill) {
            $weight = in_array(
                $skill,
                $desirableJobSkills,
                true
            )
                ? 0.5
                : 1.0;

            $totalSkillWeight += $weight;

            if (in_array($skill, $matchedSkills, true)) {
                $matchedSkillWeight += $weight;
            }
        }

        $skillScore = $totalSkillWeight > 0
            ? ($matchedSkillWeight / $totalSkillWeight) * 25
            : 25;

        $skillScore = round(
            min($skillScore, 25),
            2
        );

        /*
        |--------------------------------------------------------------------------
        | 5. Experience
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | We only count explicit professional experience.
        |
        | Academic projects and university coursework are NOT
        | automatically converted into years of employment.
        |
        */

        $requiredExperience = $this->extractRequiredExperience(
            $job->minimum_experience ?? 0
        );

        $candidateExperience = $this->extractProfessionalExperience(
            $cvText
        );

        if ($requiredExperience > 0) {
            $experienceScore = min(
                (
                    $candidateExperience /
                    $requiredExperience
                ) * 20,
                20
            );
        } else {
            /**
             * If the vacancy has no experience requirement,
             * the candidate is not penalised.
             */
            $experienceScore = 20;
        }

        $experienceScore = round(
            $experienceScore,
            2
        );

        /*
        |--------------------------------------------------------------------------
        | 6. Professional relevance
        |--------------------------------------------------------------------------
        |
        | We look at the job title and department.
        |
        */

        $titleScore = $this->calculateTitleRelevance(
            $title,
            $cvText
        );

        $departmentScore = $this->calculateDepartmentRelevance(
            $department,
            $cvText
        );

        $relevanceScore = round(
            min(
                $titleScore + $departmentScore,
                15
            ),
            2
        );

        /*
        |--------------------------------------------------------------------------
        | 7. Responsibilities
        |--------------------------------------------------------------------------
        |
        | Instead of generating thousands of literal two-word
        | combinations, we evaluate each responsibility based
        | on the concepts contained inside it.
        |
        */

        $responsibilityLines = $this->splitRequirements(
            implode("\n", [
                $description,
                $responsibilitiesText
            ])
        );

        $responsibilityResults = [];
        $totalResponsibilityScore = 0;

        foreach ($responsibilityLines as $line) {
            $concepts = [];

            foreach ($skillGroups as $canonicalSkill => $terms) {
                if (
                    $this->containsAnyTerm(
                        $this->normaliseText($line),
                        $terms
                    )
                ) {
                    $concepts[] = $canonicalSkill;
                }
            }

            /**
             * Add common work-action concepts.
             */
            $actionGroups = [
                'development' => [
                    'develop',
                    'developing',
                    'build',
                    'building',
                    'create',
                    'creating',
                    'implement',
                    'implementing'
                ],

                'maintenance' => [
                    'maintain',
                    'maintaining',
                    'maintenance'
                ],

                'debugging' => [
                    'debug',
                    'debugging',
                    'fix',
                    'fixing',
                    'troubleshoot',
                    'troubleshooting'
                ],

                'collaboration' => [
                    'collaborate',
                    'collaboration',
                    'team',
                    'teams',
                    'qa engineers',
                    'designers'
                ],

                'code review' => [
                    'code review',
                    'code reviews',
                    'review code'
                ],

                'documentation' => [
                    'documentation',
                    'technical documentation',
                    'document'
                ]
            ];

            foreach ($actionGroups as $concept => $terms) {
                if (
                    $this->containsAnyTerm(
                        $this->normaliseText($line),
                        $terms
                    )
                ) {
                    $concepts[] = $concept;
                }
            }

            $concepts = array_values(
                array_unique($concepts)
            );

            if (count($concepts) === 0) {
                continue;
            }

            $matchedConcepts = [];

            foreach ($concepts as $concept) {
                if (isset($skillGroups[$concept])) {
                    if (
                        $this->containsAnyTerm(
                            $cvText,
                            $skillGroups[$concept]
                        )
                    ) {
                        $matchedConcepts[] = $concept;
                    }
                } elseif (isset($actionGroups[$concept])) {
                    if (
                        $this->containsAnyTerm(
                            $cvText,
                            $actionGroups[$concept]
                        )
                    ) {
                        $matchedConcepts[] = $concept;
                    }
                }
            }

            $lineScore = count($concepts) > 0
                ? count($matchedConcepts) / count($concepts)
                : 0;

            $totalResponsibilityScore += $lineScore;

            $responsibilityResults[] = [
                'requirement' => trim($line),
                'matched_concepts' => $matchedConcepts,
                'total_concepts' => $concepts,
                'score_percentage' => round(
                    $lineScore * 100,
                    2
                )
            ];
        }

        if (count($responsibilityResults) > 0) {
            $responsibilitiesScore =
                (
                    $totalResponsibilityScore /
                    count($responsibilityResults)
                ) * 30;
        } else {
            $responsibilitiesScore = 30;
        }

        $responsibilitiesScore = round(
            min($responsibilitiesScore, 30),
            2
        );

        /*
        |--------------------------------------------------------------------------
        | 8. Education
        |--------------------------------------------------------------------------
        */

        $educationScore = $this->calculateEducationScore(
            $jobText,
            $cvText
        );

        /*
        |--------------------------------------------------------------------------
        | 9. Final score
        |--------------------------------------------------------------------------
        */

        $matchScore = round(
            min(
                $responsibilitiesScore +
                $skillScore +
                $experienceScore +
                $relevanceScore +
                $educationScore,
                100
            ),
            2
        );

        /*
        |--------------------------------------------------------------------------
        | 10. Category
        |--------------------------------------------------------------------------
        */

        if ($matchScore >= 80) {
            $category = 'Strong Match';
        } elseif ($matchScore >= 60) {
            $category = 'Good Match';
        } elseif ($matchScore >= 40) {
            $category = 'Possible Match';
        } else {
            $category = 'Weak Match';
        }

        /*
        |--------------------------------------------------------------------------
        | 11. Save result
        |--------------------------------------------------------------------------
        */

        $application->update([
            'match_score' => $matchScore,
            'category' => $category,
            'skills_score' => $skillScore,
            'experience_score' => $experienceScore,
            'relevance_score' => $relevanceScore,
        ]);

        /*
        |--------------------------------------------------------------------------
        | 12. Return detailed breakdown
        |--------------------------------------------------------------------------
        */

        return [
            'total_score' => $matchScore,

            'category' => $category,

            'breakdown' => [
                'responsibilities' => [
                    'score' => $responsibilitiesScore,
                    'maximum' => 30,
                    'details' => $responsibilityResults,
                ],

                'skills' => [
                    'score' => $skillScore,
                    'maximum' => 25,
                    'matched' => array_values(
                        array_unique($matchedSkills)
                    ),
                    'job_skills' => $jobSkills,
                    'required_skills' => $requiredJobSkills,
                    'desirable_skills' => $desirableJobSkills,
                    'details' => $skillMatches,
                ],

                'experience' => [
                    'score' => $experienceScore,
                    'maximum' => 20,
                    'required_years' => $requiredExperience,
                    'candidate_professional_years' => $candidateExperience,
                ],

                'relevance' => [
                    'score' => $relevanceScore,
                    'maximum' => 15,
                    'title_score' => round(
                        $titleScore,
                        2
                    ),
                    'department_score' => round(
                        $departmentScore,
                        2
                    ),
                ],

                'education' => [
                    'score' => $educationScore,
                    'maximum' => 10,
                ],
            ],
        ];
    }

    /**
     * Skill groups and related terms.
     */
    private function getSkillGroups(): array
    {
        return [
            'software development' => [
                'software development',
                'software engineering',
                'application development',
                'programming',
                'software developer',
                'software developers',
                'software engineer',
                'software engineers'
            ],

            'web development' => [
                'web development',
                'web developer',
                'web developers',
                'website development',
                'web application',
                'web applications'
            ],

            'javascript' => [
                'javascript',
                'java script',
                'js'
            ],

            'html' => [
                'html',
                'html5'
            ],

            'css' => [
                'css',
                'css3'
            ],

            'react' => [
                'react',
                'react.js',
                'reactjs'
            ],

            'frontend development' => [
                'frontend',
                'front end',
                'frontend development',
                'front-end development',
                'user interface',
                'user interfaces',
                'ui development'
            ],

            'backend development' => [
                'backend',
                'back end',
                'backend development',
                'back-end development'
            ],

            'rest api' => [
                'rest api',
                'rest apis',
                'restful api',
                'restful apis',
                'api integration',
                'api integrations'
            ],

            'http' => [
                'http',
                'https',
                'http methods'
            ],

            'database' => [
                'database',
                'databases',
                'database management',
                'database systems',
                'database-driven',
                'relational database',
                'relational databases'
            ],

            'sql' => [
                'sql',
                'sql queries',
                'mysql',
                'postgresql'
            ],

            'git' => [
                'git',
                'github',
                'gitlab',
                'version control'
            ],

            'node.js' => [
                'node.js',
                'nodejs',
                'node'
            ],

            'express.js' => [
                'express.js',
                'expressjs',
                'express'
            ],

            'typescript' => [
                'typescript',
                'ts'
            ],

            'firebase' => [
                'firebase',
                'firebase realtime database',
                'firebase authentication'
            ],

            'docker' => [
                'docker',
                'containerisation',
                'containerization'
            ],

            'aws' => [
                'aws',
                'amazon web services',
                'cloud platform',
                'cloud platforms',
                'cloud computing'
            ],

            'testing' => [
                'testing',
                'software testing',
                'functional testing',
                'automated testing',
                'unit testing',
                'unit tests',
                'integration testing',
                'integration tests',
                'test automation',
                'playwright'
            ],

            'debugging' => [
                'debugging',
                'debug',
                'troubleshooting'
            ],

            'agile' => [
                'agile',
                'scrum',
                'agile practices',
                'agile methodology',
                'sprint planning'
            ],

            'communication' => [
                'communication',
                'written communication',
                'verbal communication',
                'interpersonal communication'
            ],

            'teamwork' => [
                'teamwork',
                'team work',
                'team collaboration',
                'collaboration',
                'collaborative teams'
            ],

            'problem solving' => [
                'problem solving',
                'problem-solving',
                'troubleshooting'
            ],

            'documentation' => [
                'documentation',
                'technical documentation',
                'document management'
            ],

            'code review' => [
                'code review',
                'code reviews',
                'review code'
            ],

            'responsive ui' => [
                'responsive',
                'responsive design',
                'responsive user interface',
                'responsive user interfaces'
            ],

            'api integration' => [
                'api integration',
                'api integrations',
                'integrating apis',
                'integrate apis'
            ]
        ];
    }

    /**
     * Calculate job-title relevance.
     */
    private function calculateTitleRelevance(
        string $jobTitle,
        string $cvText
    ): float {
        $title = $this->normaliseText($jobTitle);

        if ($title === '') {
            return 0;
        }

        /**
         * Software developer / software engineer family.
         */
        if (
            $this->containsAnyTerm(
                $title,
                [
                    'developer',
                    'software developer',
                    'software engineer',
                    'software engineering',
                    'programmer',
                    'web developer',
                    'full stack developer',
                    'full-stack developer'
                ]
            )
        ) {
            if (
                $this->containsAnyTerm(
                    $cvText,
                    [
                        'software developer',
                        'software engineer',
                        'software engineering',
                        'developer',
                        'developers',
                        'programmer',
                        'web developer',
                        'full stack developer',
                        'full-stack developer'
                    ]
                )
            ) {
                return 10;
            }

            return 0;
        }

        /**
         * Data analyst family.
         */
        if (
            $this->containsAnyTerm(
                $title,
                [
                    'data analyst',
                    'data analytics',
                    'data analysis'
                ]
            )
        ) {
            if (
                $this->containsAnyTerm(
                    $cvText,
                    [
                        'data analyst',
                        'data analytics',
                        'data analysis',
                        'analytics'
                    ]
                )
            ) {
                return 10;
            }

            return 0;
        }

        /**
         * Generic fallback:
         * compare meaningful title words.
         */
        $titleWords = $this->getMeaningfulWords($title);

        if (count($titleWords) === 0) {
            return 0;
        }

        $matched = 0;

        foreach ($titleWords as $word) {
            if ($this->containsTerm($cvText, $word)) {
                $matched++;
            }
        }

        return round(
            ($matched / count($titleWords)) * 10,
            2
        );
    }

    /**
     * Calculate department relevance.
     */
    private function calculateDepartmentRelevance(
        string $department,
        string $cvText
    ): float {
        if ($department === '') {
            return 5;
        }

        $departmentTerms = [
            'it' => [
                'it',
                'information technology',
                'software',
                'software engineering',
                'computer science',
                'technology',
                'web development',
                'software development',
                'programming'
            ],

            'information technology' => [
                'information technology',
                'it',
                'software engineering',
                'computer science',
                'technology'
            ],

            'software' => [
                'software',
                'software engineering',
                'software development',
                'programming',
                'developer'
            ],

            'engineering' => [
                'engineering',
                'software engineering',
                'computer engineering',
                'developer'
            ]
        ];

        $terms = $departmentTerms[$department] ?? [
            $department
        ];

        return $this->containsAnyTerm(
            $cvText,
            $terms
        )
            ? 5
            : 0;
    }

    /**
     * Calculate education score.
     *
     * Maximum = 10.
     */
    private function calculateEducationScore(
        string $jobText,
        string $cvText
    ): float {
        $educationRequired =
            $this->containsAnyTerm(
                $jobText,
                [
                    'degree',
                    'diploma',
                    'bachelor',
                    'bachelors',
                    'higher diploma',
                    'bsc',
                    'b.sc'
                ]
            );

        /**
         * If the job does not mention an education
         * requirement, do not penalise the candidate.
         */
        if (!$educationRequired) {
            return 10;
        }

        $qualificationMatch =
            $this->containsAnyTerm(
                $cvText,
                [
                    'degree',
                    'bachelor',
                    'bachelors',
                    'bsc',
                    'b.sc',
                    'bsc hons',
                    'b.sc hons',
                    'master',
                    'masters',
                    'msc',
                    'm.sc',
                    'phd',
                    'higher diploma',
                    'diploma'
                ]
            );

        $fieldMatch =
            $this->containsAnyTerm(
                $cvText,
                [
                    'software engineering',
                    'software engineer',
                    'computer science',
                    'information technology',
                    'information systems',
                    'computer engineering',
                    'it'
                ]
            );

        if ($qualificationMatch && $fieldMatch) {
            return 10;
        }

        if ($qualificationMatch) {
            return 5;
        }

        return 0;
    }

    /**
     * Extract required experience from values such as:
     *
     * 2
     * 2+
     * 2 years
     * 2+ years
     */
    private function extractRequiredExperience($value): float
    {
        $text = (string) $value;

        if (
            preg_match(
                '/(\d+(?:\.\d+)?)/',
                $text,
                $matches
            )
        ) {
            return (float) $matches[1];
        }

        return 0;
    }

    /**
     * Extract explicit professional experience.
     *
     * We intentionally do NOT count:
     *
     * - university years
     * - academic projects
     * - coursework
     * - "undergraduate"
     * - project experience
     *
     * unless the CV explicitly states professional experience.
     */
    private function extractProfessionalExperience(
        string $cvText
    ): float {
        $patterns = [
            '/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional|work|industry|commercial|employment)\s+experience/i',

            '/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s+(?:professional|work|industry|commercial)\s+experience/i',

            '/(?:professional|work|industry|commercial)\s+experience\s+(?:of\s+)?(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/i',

            '/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s+experience/i',

            '/(\d+(?:\.\d+)?)\+?\s*(?:months?|mos?)\s+(?:of\s+)?(?:professional|work|industry|commercial)\s+experience/i'
        ];

        foreach ($patterns as $pattern) {
            if (
                preg_match(
                    $pattern,
                    $cvText,
                    $matches
                )
            ) {
                $value = (float) $matches[1];

                if (
                    str_contains(
                        strtolower($matches[0]),
                        'month'
                    ) ||
                    str_contains(
                        strtolower($matches[0]),
                        'mos'
                    )
                ) {
                    return round(
                        $value / 12,
                        2
                    );
                }

                return $value;
            }
        }

        return 0;
    }

    /**
     * Split descriptions/responsibilities into individual
     * requirements.
     */
    private function splitRequirements(
        string $text
    ): array {
        $text = str_replace(
            [
                '•',
                '▪',
                '◦',
                '●',
                '▸',
                '–',
                '—'
            ],
            "\n",
            $text
        );

        $parts = preg_split(
            '/\r\n|\r|\n|[.;]+/',
            $text
        );

        $results = [];

        foreach ($parts as $part) {
            $part = trim($part);

            if (strlen($part) >= 10) {
                $results[] = $part;
            }
        }

        return array_values(
            array_unique($results)
        );
    }

    /**
     * Convert arrays / JSON fields into text.
     */
    private function fieldToText($value): string
    {
        if (is_array($value)) {
            return implode(
                "\n",
                array_map(
                    fn($item) => is_scalar($item)
                        ? (string) $item
                        : '',
                    $value
                )
            );
        }

        if ($value === null) {
            return '';
        }

        $value = (string) $value;

        /**
         * Handle JSON arrays stored in database text fields.
         */
        $decoded = json_decode(
            $value,
            true
        );

        if (
            json_last_error() === JSON_ERROR_NONE &&
            is_array($decoded)
        ) {
            return implode(
                "\n",
                array_map(
                    fn($item) => is_scalar($item)
                        ? (string) $item
                        : '',
                    $decoded
                )
            );
        }

        return $value;
    }

    /**
     * Normalise text before matching.
     */
    private function normaliseText(
        string $text
    ): string {
        $text = html_entity_decode(
            $text,
            ENT_QUOTES | ENT_HTML5,
            'UTF-8'
        );

        $text = strtolower($text);

        $text = str_replace(
            [
                '/',
                '|',
                '&'
            ],
            ' ',
            $text
        );

        $text = preg_replace(
            '/\s+/',
            ' ',
            $text
        );

        return trim($text);
    }

    /**
     * Match a whole word or phrase rather than
     * an arbitrary substring.
     */
    private function containsTerm(
        string $text,
        string $term
    ): bool {
        $text = $this->normaliseText($text);

        $term = $this->normaliseText($term);

        if ($term === '') {
            return false;
        }

        return preg_match(
            '/(?<![a-z0-9])' .
            preg_quote($term, '/') .
            '(?![a-z0-9])/i',
            $text
        ) === 1;
    }

    /**
     * Check whether any term in a list exists.
     */
    private function containsAnyTerm(
        string $text,
        array $terms
    ): bool {
        foreach ($terms as $term) {
            if (
                $this->containsTerm(
                    $text,
                    $term
                )
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get meaningful words from text.
     */
    private function getMeaningfulWords(
        string $text
    ): array {
        $text = strtolower($text);

        $text = preg_replace(
            '/[^a-z0-9\s]/',
            ' ',
            $text
        );

        $words = preg_split(
            '/\s+/',
            trim($text)
        );

        $stopWords = [
            'a',
            'an',
            'the',
            'and',
            'or',
            'of',
            'for',
            'to',
            'in',
            'on',
            'with',
            'at',
            'by',
            'from',
            'as',
            'is',
            'are',
            'be',
            'this',
            'that',
            'using',
            'use',

            'junior',
            'senior',
            'manager',
            'professional',
            'position',
            'role',
            'job'
        ];

        $meaningfulWords = [];

        foreach ($words as $word) {
            if (
                (
                    strlen($word) >= 3 ||
                    in_array(
                        $word,
                        [
                            'hr',
                            'it',
                            'qa',
                            'ui',
                            'ux',
                            'ai'
                        ],
                        true
                    )
                ) &&
                !in_array(
                    $word,
                    $stopWords,
                    true
                )
            ) {
                $meaningfulWords[] = $word;
            }
        }

        return array_values(
            array_unique(
                $meaningfulWords
            )
        );
    }
}
