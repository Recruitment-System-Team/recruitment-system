<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_positions', function (Blueprint $table) {

            // =====================================================
            // INTERVIEW 1
            // =====================================================

            $table->boolean('interview_one_locked')
                ->default(false);

            $table->date('interview_one_date')
                ->nullable();

            $table->time('interview_one_time')
                ->nullable();

            $table->foreignId('interview_one_tech_lead_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('interview_one_senior_engineer_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();


            // =====================================================
            // INTERVIEW 2
            // =====================================================

            $table->boolean('interview_two_locked')
                ->default(false);

            $table->date('interview_two_date')
                ->nullable();

            $table->time('interview_two_time')
                ->nullable();

            $table->foreignId('interview_two_hr_manager_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('interview_two_hiring_manager_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('job_positions', function (Blueprint $table) {

            $table->dropForeign([
                'interview_one_tech_lead_id',
            ]);

            $table->dropForeign([
                'interview_one_senior_engineer_id',
            ]);

            $table->dropForeign([
                'interview_two_hr_manager_id',
            ]);

            $table->dropForeign([
                'interview_two_hiring_manager_id',
            ]);

            $table->dropColumn([
                'interview_one_locked',
                'interview_one_date',
                'interview_one_time',
                'interview_one_tech_lead_id',
                'interview_one_senior_engineer_id',

                'interview_two_locked',
                'interview_two_date',
                'interview_two_time',
                'interview_two_hr_manager_id',
                'interview_two_hiring_manager_id',
            ]);
        });
    }
};