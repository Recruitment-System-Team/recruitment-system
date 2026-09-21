<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interview_feedback', function (Blueprint $table) {
            $table->id();

            $table->foreignId('interview_id')
                ->constrained('interviews')
                ->cascadeOnDelete();

            $table->foreignId('interviewer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->text('feedback');

            $table->timestamps();

            $table->unique([
                'interview_id',
                'interviewer_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_feedback');
    }
};