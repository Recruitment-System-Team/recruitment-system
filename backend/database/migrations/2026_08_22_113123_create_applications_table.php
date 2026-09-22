Schema::create('applications', function (Blueprint $table) {
    $table->id();

    $table->foreignId('candidate_id')
        ->constrained('candidates')
        ->onDelete('cascade');

    $table->foreignId('job_position_id')
        ->constrained('job_positions')
        ->onDelete('cascade');

    $table->foreignId('cv_id')
        ->nullable()
        ->constrained('cvs')
        ->nullOnDelete();

    $table->string('status')->default('new');

    $table->decimal('match_score', 5, 2)->nullable();

    $table->string('category')->nullable();

    $table->timestamp('applied_at')->nullable();

  

    $table->timestamps();
});