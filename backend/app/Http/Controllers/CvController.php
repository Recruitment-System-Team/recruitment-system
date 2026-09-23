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
     *
     * The candidate_id is obtained from the logged-in user's
     * candidate relationship. It is NOT accepted from the request.
     */
    public function store(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | 1. Get the logged-in user
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
        | 2. Get the candidate belonging to this user
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
        | 3. Validate candidate information and CV
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
        | 5. Get uploaded CV
        |--------------------------------------------------------------------------
        */

        $file = $request->file('cv');

        /*
        |--------------------------------------------------------------------------
        | 6. Store the CV
        |--------------------------------------------------------------------------
        */

        $filePath = $file->store(
            'cvs',
            'public'
        );

        /*
        |--------------------------------------------------------------------------
        | 7. Create CV database record
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
        | 8. Process PDF
        |--------------------------------------------------------------------------
        */

        if ($file->getClientMimeType() === 'application/pdf') {
            try {
                /*
                |--------------------------------------------------------------------------
                | Get full stored file path
                |--------------------------------------------------------------------------
                */

                $fullPath = Storage::disk('public')
                    ->path($filePath);

                /*
                |--------------------------------------------------------------------------
                | Create PDF parser
                |--------------------------------------------------------------------------
                */

                $parser = new Parser();

                /*
                |--------------------------------------------------------------------------
                | Parse PDF
                |--------------------------------------------------------------------------
                */

                $pdf = $parser->parseFile($fullPath);

                /*
                |--------------------------------------------------------------------------
                | Extract text
                |--------------------------------------------------------------------------
                */

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
        | 9. Reload CV
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
    public function index()
    {
        /*
        |--------------------------------------------------------------------------
        | 1. Get logged-in user
        |--------------------------------------------------------------------------
        */

        $user = request()->user();

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
    public function show($id)
    {
        /*
        |--------------------------------------------------------------------------
        | 1. Get logged-in user
        |--------------------------------------------------------------------------
        */

        $user = request()->user();

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
        | 4. Return CV
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'cv' => $cv,
        ]);
    }


    /**
     * View a CV file in the browser.
     *
     * GET /api/cvs/{id}/view
     */
    public function view(Request $request, $id)
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
        | 2. Find CV
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
        | 3. Check that the stored file exists
        |--------------------------------------------------------------------------
        */

        if (
            !$cv->file_path ||
            !Storage::disk('public')->exists($cv->file_path)
        ) {
            return response()->json([
                'message' => 'The CV file could not be found on the server.'
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | 4. Get MIME type
        |--------------------------------------------------------------------------
        */

        $mimeType = $cv->file_type;

        if (!$mimeType) {
            $mimeType = Storage::disk('public')
                ->mimeType($cv->file_path);
        }

        /*
        |--------------------------------------------------------------------------
        | 5. Return file
        |--------------------------------------------------------------------------
        |
        | "inline" tells the browser to display the PDF rather than
        | downloading it immediately.
        |
        */

        return Storage::disk('public')->response(
            $cv->file_path,
            $cv->file_name,
            [
                'Content-Type' => $mimeType ?: 'application/pdf',
                'Content-Disposition' => 'inline; filename="' .
                    addslashes($cv->file_name) .
                    '"',
            ]
        );
    }
}    */
    $allowedRoles = [
        'HR Manager',
        'Hiring Manager',
        'Interviewer',
        'System Administrator',
        'Staff',
    ];

    $roleName = trim($user->role->name);

    if (!in_array($roleName, $allowedRoles, true)) {
        return response()->json([
            'message' => 'Forbidden.',
        ], 403);
    }

    /*
    |--------------------------------------------------------------------------
    | Find CV
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
    | Check that the stored file exists
    |--------------------------------------------------------------------------
    */
    $disk = Storage::disk('public');

    if (!$disk->exists($cv->file_path)) {
        return response()->json([
            'message' => 'CV file not found.'
        ], 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Return CV inline in browser
    |--------------------------------------------------------------------------
    */
    return response()->file(
        $disk->path($cv->file_path),
        [
            'Content-Type' =>
                $cv->file_type ?: 'application/pdf',

            'Content-Disposition' =>
                'inline; filename="' .
                addslashes($cv->file_name ?? 'cv.pdf') .
                '"',
        ]
    );
}
    public function store(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | 1. Get the logged-in user
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
        | 2. Get the candidate belonging to this user
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
        | 3. Validate candidate information and CV
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
        | 4. Update the candidate profile
        |--------------------------------------------------------------------------
        */

        $candidate->update([
            'phone' => $validated['phone'],
            'linkedin' => $validated['linkedin'] ?? null,
        ]);

        /*
        |--------------------------------------------------------------------------
        | 6. Get uploaded CV
        |--------------------------------------------------------------------------
        */

        $file = $request->file('cv');

        /*
        |--------------------------------------------------------------------------
        | 7. Store the CV
        |--------------------------------------------------------------------------
        */

        $filePath = $file->store(
            'cvs',
            'public'
        );

        /*
        |--------------------------------------------------------------------------
        | 8. Create CV database record
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
        | 9. Process PDF
        |--------------------------------------------------------------------------
        |
        | At this stage, PDF files are processed using
        | Smalot PDF Parser.
        |
        */

        if ($file->getClientMimeType() === 'application/pdf') {

            try {

                /*
                |--------------------------------------------------------------------------
                | Get full stored file path
                |--------------------------------------------------------------------------
                */

                $fullPath = Storage::disk('public')
                    ->path($filePath);

                /*
                |--------------------------------------------------------------------------
                | Create PDF parser
                |--------------------------------------------------------------------------
                */

                $parser = new Parser();

                /*
                |--------------------------------------------------------------------------
                | Parse PDF
                |--------------------------------------------------------------------------
                */

                $pdf = $parser->parseFile($fullPath);

                /*
                |--------------------------------------------------------------------------
                | Extract text
                |--------------------------------------------------------------------------
                */

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
                |
                | Keep the uploaded CV but mark processing as failed.
                |
                */

                $cv->update([
                    'processing_status' => 'failed',
                ]);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | 10. Reload CV
        |--------------------------------------------------------------------------
        */

        $cv->refresh();

        /*
        |--------------------------------------------------------------------------
        | 11. Return response
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
    public function index()
    {
        /*
        |--------------------------------------------------------------------------
        | 1. Get logged-in user
        |--------------------------------------------------------------------------
        */

        $user = request()->user();

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
    public function show($id)
    {
        /*
        |--------------------------------------------------------------------------
        | 1. Get logged-in user
        |--------------------------------------------------------------------------
        */

        $user = request()->user();

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
        | 4. Return CV
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'cv' => $cv,
        ]);

        
    }
}
