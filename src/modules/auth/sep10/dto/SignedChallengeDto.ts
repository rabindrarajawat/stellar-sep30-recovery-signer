"use strict";
import { ApiProperty} from "@nestjs/swagger";
import { IsString } from "class-validator";

export class SignedChallengeDto {
    @ApiProperty({
        example:`${`AAAAAgAAAADIiRu2BrqqeOcP28PWCkD4D5Rjjsqh71HwvqFX+F4VXAAAAGQAAAAAAAAAAAAAAAEAAAAAXzrUcQAAAABfOtf1AAAAAAAAAAEAAAABAAAAAEEB8rhqNa70RYjaNnF1ARE2CbL50iR9HPXST/fImJN1AAAACgAAADB0aGlzaXNhdGVzdC5zYW5kYm94LmFuY2hvci5hbmNob3Jkb21haW4uY29tIGF1dGgAAAABAAAAQGdGOFlIQm1zaGpEWEY0L0VJUFZucGVlRkxVTDY2V0tKMVBPYXZuUVVBNjBoL09XaC91M2Vvdk54WFJtSTAvQ2UAAAAAAAAAAvheFVwAAABAheKE1HjGnUCNwPbX8mz7CqotShKbA+xM2Hbjl6X0TBpEprVOUVjA6lqMJ1j62vrxn1mF3eJzsLa9s9hRofG3AsiYk3UAAABArIrkvqmA0V9lIZcVyCUdja6CiwkPwsV8BfI4CZOyR1Oq7ysvNJWwY0G42dpxN9OP1qz4dum8apG2hqvxVWjkDQ==`}`,
        description:`The base64 encoded signed challenge transaction XDR`,
        isArray:false,
        name:'transaction',
        })
    @IsString()
    transaction: string;
}
