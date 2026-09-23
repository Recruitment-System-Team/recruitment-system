<?php

namespace App\Http\Controllers;

use App\Models\Cv;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser;
use Throwable;

class CvController extends Controller
{
    /**
     * Upload a CV for the currently authenticated candidate.
     */
    public function store(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | 1. Get logged-in user
        |--------------------------------------------------------------------------
        */

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        /*
        |--------------------------------------------------------------------------
        | 2. Get candidate
        |--------------------------------------------------------------------------
        */

        $candidate = $user->candidate;

        if (!$candidate) {
            return response()->json([
                'message' => 'No candidate profile is associated with this account.'
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | 3. Validate request
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([
            'full_name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
            ],

            'phone' => [
                'required',
                'string',
                'max:30',
            ],

            'linkedin' => [
                'nullable',
                'url',
                'max:500',
            ],

            'cv' => [
                'required',
                'file',
                'mimes:pdf,doc,docx',
                'max:10240',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | 4. Update candidate profile
        |--------------------------------------------------------------------------
        */

        $candidate->update([
            'phone' => $validated['phone'],
            'linkedin' => $validated['linkedin'] ?? null,
        ]);

        /*
        |--------------------------------------------------------------------------
        | 5. Get uploaded file
        |--------------------------------------------------------------------------
        */

        $file = $request->file('cv');

        /*
        |--------------------------------------------------------------------------
        | 6. Store CV
        |--------------------------------------------------------------------------
        */

        $filePath = $file->store(
            'cvs',
            'public'
        );

        /*
        |--------------------------------------------------------------------------
        | 7. Create CV record
        |--------------------------------------------------------------------------
        */

        $cv = Cv::create([
            'candidate_id' => $candidate->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $filePath,
            'file_type' => $file->getClientMimeType(),
            'extracted_text' => null,
            'processing_status' => 'pending',
        ]);

        /*
        |--------------------------------------------------------------------------
        | 8. Extract PDF text
        |--------------------------------------------------------------------------
        */

        if ($file->getClientMimeType() === 'application/pdf') {

            try {

                $fullPath = Storage::disk('public')
                    ->path($filePath);

                $parser = new Parser();

                $pdf = $parser->parseFile($fullPath);

                $text = $pdf->getText();

                /*
                |--------------------------------------------------------------------------
                | Clean extracted text
                |--------------------------------------------------------------------------
                */

                $text = preg_replace(
                    '/[ \t]+/',
                    ' ',
                    $text
                );

                $text = preg_replace(
                    "/\n{3,}/",
                    "\n\n",
                    $text
                );

                $text = trim($text);

                /*
                |--------------------------------------------------------------------------
                | Save extracted text
                |--------------------------------------------------------------------------
                */

                $cv->update([
                    'extracted_text' => $text,
                    'processing_status' => 'processed',
                ]);

            } catch (Throwable $exception) {

                /*
                |--------------------------------------------------------------------------
                | Extraction failed
                |--------------------------------------------------------------------------
                */

                $cv->update([
                    'processing_status' => 'failed',
                ]);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | 9. Refresh CV
        |--------------------------------------------------------------------------
        */

        $cv->refresh();

        /*
        |--------------------------------------------------------------------------
        | 10. Return response
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'message' => 'CV uploaded successfully.',

            'candidate' => [
                'id' => $candidate->id,
                'user_id' => $candidate->user_id,
                'full_name' => $user->name,
                'email' => $user->email,
                'phone' => $candidate->phone,
                'linkedin' => $candidate->linkedin,
            ],

            'cv' => $cv,

        ], 201);
    }


    /**
     * Get all CVs belonging to the authenticated candidate.
     */
    public function index(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | 1. Get logged-in user
        |--------------------------------------------------------------------------
        */

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        /*
        |--------------------------------------------------------------------------
        | 2. Get candidate
        |--------------------------------------------------------------------------
        */

        $candidate = $user->candidate;

        if (!$candidate) {
            return response()->json([
                'message' => 'No candidate profile is associated with this account.'
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | 3. Get candidate CVs
        |--------------------------------------------------------------------------
        */

        $cvs = $candidate->cvs()
            ->latest()
            ->get();

        /*
        |--------------------------------------------------------------------------
        | 4. Return CVs
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'candidate' => [
                'id' => $candidate->id,
                'user_id' => $candidate->user_id,
                'full_name' => $user->name,
                'email' => $user->email,
                'phone' => $candidate->phone,
                'linkedin' => $candidate->linkedin,
            ],

            'cvs' => $cvs,
        ]);
    }


    /**
     * Get a single CV belonging to the authenticated candidate.
     */
    public function show(Request $request, $id)
    {
        /*
        |--------------------------------------------------------------------------
        | 1. Get logged-in user
        |--------------------------------------------------------------------------
        */

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        /*
        |--------------------------------------------------------------------------
        | 2. Get candidate
        |--------------------------------------------------------------------------
        */

        $candidate = $user->candidate;

        if (!$candidate) {
            return response()->json([
                'message' => 'No candidate profile is associated with this account.'
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | 3. Find CV belonging to this candidate
        |--------------------------------------------------------------------------
        */

        $cv = Cv::where('id', $id)
            ->where('candidate_id', $candidate->id)
            ->with('candidate')
            ->first();

        if (!$cv) {
            return response()->json([
                'message' => 'CV not found.'
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | 4. Return CV information
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'cv' => $cv,
        ]);
    }


    /**
     * View a candidate CV from the HR/staff dashboard.
     *
     * GET /api/cvs/{id}/view
     */
    public function viewForStaff(Request $request, $id)
    {
        /*
        |--------------------------------------------------------------------------
        | 1. Check authentication
        |--------------------------------------------------------------------------
        */

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        /*
        |--------------------------------------------------------------------------
        | 2. Check staff role
        |--------------------------------------------------------------------------
        */

        $allowedRoles = [
            'HR Manager',
            'Hiring Manager',
            'Interviewer',
            'System Administrator',
            'Staff',
        ];

        if (!$user->role) {
            return response()->json([
                'message' => 'Forbidden.'
            ], 403);
        }

        $roleName = trim($user->role->name);

        if (!in_array($roleName, $allowedRoles, true)) {
            return response()->json([
                'message' => 'Forbidden.'
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | 3. Find CV
        |--------------------------------------------------------------------------
        */

        $cv = Cv::find($id);

        if (!$cv) {
            return response()->json([
                'message' => 'CV not found.'
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | 4. Check stored file
        |--------------------------------------------------------------------------
        */

        if (!$cv->file_path) {
            return response()->json([
                'message' => 'CV file path is missing.'
            ], 404);
        }

        $disk = Storage::disk('public');

        if (!$disk->exists($cv->file_path)) {
            return response()->json([
                'message' => 'CV file not found on the server.'
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | 5. Get MIME type
        |--------------------------------------------------------------------------
        */

        $mimeType = $cv->file_type;

        if (!$mimeType) {
            $mimeType = $disk->mimeType($cv->file_path);
        }

        /*
        |--------------------------------------------------------------------------
        | 6. PDF files can be displayed directly in browser
        |--------------------------------------------------------------------------
        */

        if ($mimeType === 'application/pdf') {

            return response()->file(
                $disk->path($cv->file_path),
                [
                    'Content-Type' => 'application/pdf',

                    'Content-Disposition' =>
                        'inline; filename="' .
                        addslashes(
                            $cv->file_name ?? 'cv.pdf'
                        ) .
                        '"',
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | 7. DOC / DOCX files cannot normally be previewed
        |    directly by the browser.
        |
        |    Download them instead.
        |--------------------------------------------------------------------------
        */

        return $disk->download(
            $cv->file_path,
            $cv->file_name ?? 'cv'
        );
    }
}
