<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            $table->foreignId('hr_manager_id')
                ->nullable()
                ->after('senior_engineer_id')
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('hiring_manager_id')
                ->nullable()
                ->after('hr_manager_id')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            $table->dropForeign(['hr_manager_id']);
            $table->dropForeign(['hiring_manager_id']);

            $table->dropColumn([
                'hr_manager_id',
                'hiring_manager_id',
            ]);
        });
    }
};