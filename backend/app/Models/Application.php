<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    use HasFactory;

protected $fillable = [
    'candidate_id',
    'job_position_id',
    'cv_id',
    'status',
    'match_score',
    'category',
    'skills_score',
    'experience_score',
    'relevance_score',
    'applied_at',
    'sent_to_hiring_manager',
    'shortlisted_by_hiring_manager',
];

protected $casts = [
    'match_score' => 'float',
    'skills_score' => 'float',
    'experience_score' => 'float',
    'relevance_score' => 'float',
    'sent_to_hiring_manager' => 'boolean',
    'shortlisted_by_hiring_manager' => 'boolean',
];

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    public function jobPosition()
    {
        return $this->belongsTo(JobPosition::class);
    }

    public function cv()
    {
        return $this->belongsTo(Cv::class);
    }

    public function interviews()
{
    return $this->hasMany(Interview::class);
}

}

