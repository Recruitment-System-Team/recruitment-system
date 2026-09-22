<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class HrTestUserSeeder extends Seeder
{
    public function run(): void
    {
        $testPassword = env('TEST_STAFF_PASSWORD');

        if (!$testPassword) {
            throw new \RuntimeException('TEST_STAFF_PASSWORD is not set.');
        }

        $staffUsers = [
            [
                'name' => 'Test HR Manager',
                'email' => 'hr@test.com',
                'role' => 'HR Manager',
            ],
            [
                'name' => 'Test Hiring Manager',
                'email' => 'hiring@test.com',
                'role' => 'Hiring Manager',
            ],
            [
                'name' => 'Test Interviewer',
                'email' => 'interviewer@test.com',
                'role' => 'Interviewer',
            ],
            [
                'name' => 'Test System Administrator',
                'email' => 'admin@test.com',
                'role' => 'System Administrator',
            ],
        ];

        foreach ($staffUsers as $staff) {
            $role = Role::where('name', $staff['role'])->firstOrFail();

            User::updateOrCreate(
                ['email' => $staff['email']],
                [
                    'name' => $staff['name'],
                    'password' => Hash::make($testPassword),
                    'role_id' => $role->id,
                ]
            );
        }
    }
}