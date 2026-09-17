<?php

namespace App\Http\Controllers;

use App\Models\JobPosition;
use Illuminate\Http\Request;

class JobPositionController extends Controller
{
    // Get all job vacancies
    public function index()
    {
        $jobs = JobPosition::latest()->get();

        return response()->json($jobs);
    }

    // Create a new job vacancy
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'description' => 'required|string',
            'responsibilities' => 'nullable|string',
            'minimum_experience' => 'nullable|integer|min:0',
            'employment_type' => 'nullable|string|max:100',
            'status' => 'nullable|in:open,closed,on_hold',
        ]);

        $validated['created_by'] = auth()->id();

        $job = JobPosition::create($validated);

        return response()->json([
            'message' => 'Job vacancy created successfully.',
            'job' => $job,
        ], 201);
    }

    // Get one specific vacancy
    public function show($id)
    {
        $job = JobPosition::findOrFail($id);

        return response()->json($job);
    }

//close applications for a specific vacancy

    public function closeApplications($id)
{
    $jobPosition = JobPosition::findOrFail($id);

    $jobPosition->update([
        'status' => 'closed',
    ]);

    return response()->json([
        'message' => 'Applications for this vacancy have been closed.',
        'job' => $jobPosition,
    ]);
}

    /**
 * Delete a vacancy.
 */
public function destroy($id)
{
    $jobPosition = JobPosition::findOrFail($id);

    $jobPosition->delete();

    return response()->json([
        'message' => 'Vacancy deleted successfully.'
    ]);
}

public function shortlisted($id)
{
    $job = JobPosition::findOrFail($id);

    $applications = \App\Models\Application::with([
        'candidate.user',
        'cv'
    ])
        ->where('job_position_id', $job->id)
        ->where('match_score', '>=', 60)
        ->where('status', '!=', 'rejected')
        ->orderByDesc('match_score')
        ->limit(5)
        ->get();

    $shortlistedCandidates = $applications->map(function ($application) {
        return [
            'application_id' => $application->id,
            'candidate_name' => $application->candidate->user->name ?? 'Unknown',
            'email' => $application->candidate->user->email ?? 'N/A',
            'match_score' => $application->match_score,
            'category' => $application->category,
            'status' => $application->status,
        ];
    });

    return response()->json([
        'shortlisted_candidates' => $shortlistedCandidates
    ]);
}

}