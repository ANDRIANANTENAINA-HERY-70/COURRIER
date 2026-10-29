<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Throttle Configuration
    |--------------------------------------------------------------------------
    |
    | Define the rate limiting configuration for your application.
    |
    */

    'limiters' => [
        'api' => [
            'limiter' => \Illuminate\Cache\RateLimiting\Limit::perMinute(60),
        ],
    ],

];
