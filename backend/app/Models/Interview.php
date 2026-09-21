<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Interview extends Model
{
    use HasFactory;

   protected $fillable = [
    'application_id',
    'interview_number',

    // Interview 1
    'tech_lead_id',
    'senior_engineer_id',

    // Interview 2
    'hr_manager_id',
    'hiring_manager_id',

    'scheduled_date',
    'scheduled_time',
    'status',
    'meeting_link',
    'feedback',
    'feedback_rating',
    'feedback_submitted_at',
    'notes',
];

    protected $casts = [
        'scheduled_date' => 'date',
        'feedback_submitted_at' => 'datetime',
        'feedback_rating' => 'integer',
        'interview_number' => 'integer',
    ];

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function techLead()
    {
        return $this->belongsTo(User::class, 'tech_lead_id');
    }

    public function seniorEngineer()
    {
        return $this->belongsTo(User::class, 'senior_engineer_id');
    }

    public function hrManager()
{
    return $this->belongsTo(User::class, 'hr_manager_id');
}

public function hiringManager()
{
    return $this->belongsTo(User::class, 'hiring_manager_id');
}
}