<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourrierFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_send_and_read_courriers(): void
    {
        $alice = User::factory()->create(['name' => 'Alice', 'email' => 'alice@test.local']);
        $bob   = User::factory()->create(['name' => 'Bob', 'email' => 'bob@test.local']);

        // Alice envoie un courrier à Bob
        $payload = [
            'receiver_id' => $bob->id,
            'objet' => 'Hello',
            'message' => 'Bonjour Bob',
        ];

        $this->actingAs($alice)->postJson('/api/courriers', $payload)
            ->assertCreated()
            ->assertJsonPath('data.sender_id', $alice->id)
            ->assertJsonPath('data.receiver_id', $bob->id)
            ->assertJsonPath('data.objet', 'Hello');

        // Bob voit le courrier en inbox
        $this->actingAs($bob)->getJson('/api/courriers/inbox')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.receiver_id', $bob->id);

        // Alice le voit en envoyé
        $this->actingAs($alice)->getJson('/api/courriers/sent')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.sender_id', $alice->id);

        // Compat email : Bob peut lire son inbox par email, mais pas celle d'un autre
        $this->actingAs($bob)->getJson('/api/inbox/' . $bob->email)->assertOk();
        $this->actingAs($bob)->getJson('/api/inbox/' . $alice->email)->assertForbidden();
    }
}
