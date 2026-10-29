<?php

namespace App\Http\Controllers;

use App\Models\UserSetting;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class UserSettingController extends Controller
{
    private function defaults(): array
    {
        return [
            'language' => 'fr',
            'notifications' => true,
            'email_notifications' => false,
            'theme' => 'light',
            'auto_save' => true,
            'session_timeout' => 30,
            'two_factor_enabled' => false,
            'timezone' => 'Indian/Antananarivo',
            'date_format' => 'DD/MM/YYYY',
            'time_format' => 'HH:mm',
            'items_per_page' => 10,
            'sound_notifications' => true,
            'desktop_notifications' => false,
            'custom_settings' => [],
        ];
    }

    private function ensureTableExists(): void
    {
        if (Schema::hasTable('user_settings')) {
            return;
        }

        Schema::create('user_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('language')->default('fr');
            $table->boolean('notifications')->default(true);
            $table->boolean('email_notifications')->default(false);
            $table->string('theme')->default('light');
            $table->boolean('auto_save')->default(true);
            $table->integer('session_timeout')->default(30);
            $table->boolean('two_factor_enabled')->default(false);
            $table->string('timezone')->default('Indian/Antananarivo');
            $table->string('date_format')->default('DD/MM/YYYY');
            $table->string('time_format')->default('HH:mm');
            $table->integer('items_per_page')->default(10);
            $table->boolean('sound_notifications')->default(true);
            $table->boolean('desktop_notifications')->default(false);
            $table->json('custom_settings')->nullable();
            $table->timestamps();
            $table->unique('user_id');
        });
    }

    public function show(Request $request)
    {
        $this->ensureTableExists();
        $user = $request->user();

        $settings = UserSetting::firstOrCreate(
            ['user_id' => $user->id],
            $this->defaults()
        );

        return response()->json([
            'success' => true,
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $this->ensureTableExists();
        $user = $request->user();

        $validated = $request->validate([
            'language' => ['sometimes', 'string', Rule::in(['fr', 'en'])],
            'notifications' => ['sometimes', 'boolean'],
            'email_notifications' => ['sometimes', 'boolean'],
            'theme' => ['sometimes', 'string', Rule::in(['light', 'dark'])],
            'auto_save' => ['sometimes', 'boolean'],
            'session_timeout' => ['sometimes', 'integer', 'min:5', 'max:240'],
            'two_factor_enabled' => ['sometimes', 'boolean'],
            'timezone' => ['sometimes', 'string', 'max:100'],
            'date_format' => ['sometimes', 'string', 'max:50'],
            'time_format' => ['sometimes', 'string', 'max:50'],
            'items_per_page' => ['sometimes', 'integer', 'min:5', 'max:100'],
            'sound_notifications' => ['sometimes', 'boolean'],
            'desktop_notifications' => ['sometimes', 'boolean'],
            'custom_settings' => ['sometimes', 'array'],
        ]);

        $settings = UserSetting::firstOrNew(['user_id' => $user->id]);
        $settings->fill($validated);
        $settings->user_id = $user->id;
        $settings->save();

        return response()->json([
            'success' => true,
            'message' => 'Paramètres enregistrés avec succès.',
            'settings' => $settings,
        ]);
    }
}
