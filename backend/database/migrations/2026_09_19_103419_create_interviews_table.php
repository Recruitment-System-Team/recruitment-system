<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interviews', function (Blueprint $table) {
            $table->id();

            // The candidate application being interviewed
            $table->foreignId('application_id')
                ->constrained('applications')
                ->cascadeOnDelete();

            // Interview 1 or Interview 2
            $table->unsignedTinyInteger('interview_number');

            // Selected interviewers
            $table->foreignId('tech_lead_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('senior_engineer_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Scheduled interview details
            $table->date('scheduled_date')->nullable();
            $table->time('scheduled_time')->nullable();

            $table->string('status')
                ->default('pending');

            $table->string('meeting_link')
                ->nullable();

            // Interviewer feedback
            $table->text('feedback')
                ->nullable();

            $table->unsignedTinyInteger('feedback_rating')
                ->nullable();

            $table->timestamp('feedback_submitted_at')
                ->nullable();

            $table->text('notes')
                ->nullable();

            $table->timestamps();

            // Prevent duplicate Interview 1 or Interview 2
            // for the same application.
            $table->unique([
                'application_id',
                'interview_number'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};