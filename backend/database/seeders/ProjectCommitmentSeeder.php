<?php

namespace Database\Seeders;

use App\Models\ProjectCommitment;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProjectCommitmentSeeder extends Seeder
{
    public function run(): void
    {
        $techLead = User::where('name', 'Martin Silva')->first();
        $seniorEngineer = User::where('name', 'Olivia Fernando')->first();

        if ($techLead) {
            ProjectCommitment::create([
                'user_id' => $techLead->id,
                'project_name' => 'Altriam Mobile Application',
                'description' => 'Final development and delivery deadline.',
                'deadline' => '2026-09-21',
                'status' => 'In Progress',
            ]);

            ProjectCommitment::create([
                'user_id' => $techLead->id,
                'project_name' => 'Client Portal',
                'description' => 'Client review and project delivery.',
                'deadline' => '2026-09-28',
                'status' => 'In Progress',
            ]);
        }

        if ($seniorEngineer) {
            ProjectCommitment::create([
                'user_id' => $seniorEngineer->id,
                'project_name' => 'Recruitment Platform',
                'description' => 'Production deployment deadline.',
                'deadline' => '2026-09-23',
                'status' => 'In Progress',
            ]);

            ProjectCommitment::create([
                'user_id' => $seniorEngineer->id,
                'project_name' => 'API Integration',
                'description' => 'Final integration and testing deadline.',
                'deadline' => '2026-09-30',
                'status' => 'In Progress',
            ]);
        }
    }
}