<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_commitments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('project_name');
            $table->text('description')->nullable();
            $table->date('deadline');
            $table->string('status')->default('In Progress');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_commitments');
    }
};