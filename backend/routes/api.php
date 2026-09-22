<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\JobPositionController;
use App\Http\Controllers\CvController;
use App\Http\Controllers\CandidateController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\InterviewController;
use App\Http\Controllers\GoogleCalendarController;


/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Login
Route::post(
    '/login',
    [AuthController::class, 'login']
)->name('login');

Route::post(
    '/login/candidate',
    [AuthController::class, 'loginCandidate']
);

Route::post(
    '/login/hr',
    [AuthController::class, 'loginHr']
);


// Candidate registration
Route::post(
    '/register-candidate',
    [AuthController::class, 'registerCandidate']
);

Route::post(
    '/register-hr',
    [AuthController::class, 'registerHr']
);


/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {


    /*
    |--------------------------------------------------------------------------
    | System Administrator
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:System Administrator')->group(function () {

    Route::get(
        '/admin/users',
        [AdminController::class, 'index']
    );

    Route::post(
        '/admin/users',
        [AdminController::class, 'store']
    );

    // Connect a Google Calendar for a specific staff member
    Route::get(
        '/admin/users/{user}/google-calendar/connect',
        [AdminController::class, 'connectCalendar']
    );
});

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/logout',
        [AuthController::class, 'logout']
    );


    /*
    |--------------------------------------------------------------------------
    | Job Vacancies
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/job-positions',
        [JobPositionController::class, 'index']
    );


    /*
    |--------------------------------------------------------------------------
    | HR Manager
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:HR Manager')->group(function () {

        // Create vacancy
        Route::post(
            '/job-positions',
            [JobPositionController::class, 'store']
        );

        // Close applications
        Route::patch(
            '/job-positions/{id}/close',
            [JobPositionController::class, 'closeApplications']
        );

        // Get primary shortlisted candidates
        Route::get(
            '/job-positions/{id}/shortlisted',
            [JobPositionController::class, 'shortlisted']
        );

        // View vacancy
        Route::get(
            '/job-positions/{id}',
            [JobPositionController::class, 'show']
        );

        // Delete vacancy
        Route::delete(
            '/job-positions/{id}',
            [JobPositionController::class, 'destroy']
        );


        // Update application status
        Route::patch(
            '/applications/{id}/status',
            [ApplicationController::class, 'updateStatus']
        );

        // Evaluate candidate
        Route::post(
            '/applications/{id}/evaluate',
            [ApplicationController::class, 'evaluate']
        );

        // Send primary shortlist to Hiring Manager
        Route::post(
            '/applications/send-to-hiring-manager',
            [ApplicationController::class, 'sendToHiringManager']
        );


        // Candidates
        Route::get(
            '/candidates',
            [CandidateController::class, 'index']
        );

        Route::post(
            '/candidates',
            [CandidateController::class, 'store']
        );

        Route::get(
            '/candidates/{id}',
            [CandidateController::class, 'show']
        );

        Route::get(
    '/interviews/my-feedbacks',
    [InterviewController::class, 'myFeedbacks']
);
    });


    /*
    |--------------------------------------------------------------------------
    | Hiring Manager
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:Hiring Manager')->group(function () {

        // Update application status
        Route::patch(
            '/applications/{id}/status',
            [ApplicationController::class, 'updateStatus']
        );

        // Send selected candidates back to HR
        Route::post(
            '/applications/send-shortlisted-to-hr',
            [ApplicationController::class, 'sendShortlistedToHR']
        );

         Route::get(
        '/interviews/{id}/feedback/all',
        [InterviewController::class, 'getAllFeedback']
    );

    Route::patch(
        '/interviews/{id}/feedback',
        [InterviewController::class, 'updateMyFeedback']
    );

    });


    /*
    |--------------------------------------------------------------------------
    | CV Management
    |--------------------------------------------------------------------------
    */

    // Candidate CV routes
    Route::middleware('role:Candidate')->group(function () {

        Route::post(
            '/cvs',
            [CvController::class, 'store']
        );

        Route::get(
            '/cvs',
            [CvController::class, 'index']
        );

        Route::get(
            '/cvs/{id}',
            [CvController::class, 'show']
        );
    });


    // Staff CV viewing
    Route::get(
        '/cvs/{id}/view',
        [CvController::class, 'viewForStaff']
    );


    /*
    |--------------------------------------------------------------------------
    | Applications
    |--------------------------------------------------------------------------
    */

    // View applications
    Route::get(
        '/applications',
        [ApplicationController::class, 'index']
    );


    // Candidate submits application
    Route::middleware('role:Candidate')->post(
        '/applications',
        [ApplicationController::class, 'store']
    );


    // View single application
    Route::get(
        '/applications/{id}',
        [ApplicationController::class, 'show']
    );


    /*
    |--------------------------------------------------------------------------
    | Interviews - HR Manager
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:HR Manager')->group(function () {

        // Candidates available for Interview 1
        Route::get(
            '/interviews/interview-one/candidates',
            [InterviewController::class, 'interviewOneCandidates']
        );


        // Candidates who passed Interview 1
        // and can proceed to Interview 2
        Route::get(
            '/interviews/interview-two/candidates',
            [InterviewController::class, 'interviewTwoCandidates']
        );


        // Get interviewer accounts
        Route::get(
            '/interviews/interviewers',
            [InterviewController::class, 'interviewers']
        );


        // Schedule Interview 1 or Interview 2
        Route::post(
            '/interviews',
            [InterviewController::class, 'store']
        );

        // Check an individual staff member's Google Calendar
        Route::get(
    '/interviews/interviewer-availability',
    [InterviewController::class, 'interviewerAvailability']
);

Route::post(
    '/interviews/move-to-interview-two',
    [InterviewController::class, 'moveToInterviewTwo']
);


    });


    /*
    |--------------------------------------------------------------------------
    | View Scheduled Interviews
    |--------------------------------------------------------------------------
    */

    // Used by authenticated staff
    // HR will use this for the interview schedule
    // Interviewers will use this for their assigned interviews
    Route::get(
        '/interviews',
        [InterviewController::class, 'index']
    );


    /*
    |--------------------------------------------------------------------------
    | Interviewer
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:Interviewer')->group(function () {



    Route::get(
    '/interviews/my',
    [InterviewController::class, 'myInterviews']
);


        // Update interview status
        Route::patch(
            '/interviews/{id}/status',
            [InterviewController::class, 'updateStatus']
        );
    });
Route::get(
    '/interviews/{id}/feedback',
    [InterviewController::class, 'getMyFeedback']
);

Route::post(
    '/interviews/{id}/feedback',
    [InterviewController::class, 'storeMyFeedback']
);


    

});

/*
|--------------------------------------------------------------------------
| Google Calendar
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    Route::get(
        '/google-calendar/connect',
        [GoogleCalendarController::class, 'connect']
    );

    Route::get(
        '/google-calendar/availability',
        [GoogleCalendarController::class, 'availability']
    );
});

/*
|--------------------------------------------------------------------------
| Google Calendar OAuth Callback
|--------------------------------------------------------------------------
| This must NOT use auth:sanctum because Google redirects here
| without the Laravel bearer token.
*/

Route::get(
    '/google-calendar/callback',
    [GoogleCalendarController::class, 'callback']
);