<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterviewFeedback extends Model
{
    protected $table = 'interview_feedback';

    protected $fillable = [
        'interview_id',
        'interviewer_id',
        'feedback',
    ];

    public function interview(): BelongsTo
    {
        return $this->belongsTo(Interview::class);
    }

    public function interviewer(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'interviewer_id'
        );
    }
}