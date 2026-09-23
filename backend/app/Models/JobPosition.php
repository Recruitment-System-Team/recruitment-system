<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobPosition extends Model
{
    protected $fillable = [
        'title',
        'department',
        'description',
        'responsibilities',
        'minimum_experience',
        'employment_type',
        'status',
        'created_by',

        // =====================================================
        // INTERVIEW 1 SCHEDULE
        // =====================================================
        'interview_one_locked',
        'interview_one_date',
        'interview_one_time',
        'interview_one_tech_lead_id',
        'interview_one_senior_engineer_id',

        // =====================================================
        // INTERVIEW 2 SCHEDULE
        // =====================================================
        'interview_two_locked',
        'interview_two_date',
        'interview_two_time',
        'interview_two_hr_manager_id',
        'interview_two_hiring_manager_id',
    ];

    protected $casts = [
        'interview_one_locked' => 'boolean',
        'interview_one_date' => 'date',
        'interview_one_time' => 'string',

        'interview_two_locked' => 'boolean',
        'interview_two_date' => 'date',
        'interview_two_time' => 'string',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }
}