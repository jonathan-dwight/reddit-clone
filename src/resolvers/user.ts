import { MyContext } from "../types";
import { User } from "../entities/User";
import { Arg, Ctx, Field, InputType, Mutation, Resolver } from "type-graphql";
import argon2 from 'argon2';


@InputType()
class UsernamePasswordInput {
    @Field(() => String)
    username: string
    @Field(() => String)
    password: string
}


@Resolver()
export class UserResolver {
    @Mutation(() => User)
    async register(
        @Arg('options', () => UsernamePasswordInput) options: UsernamePasswordInput,
        @Ctx() { em } : MyContext

    ) {
        const hashPassword = await argon2.hash(options.password);
        const user = em.create(User, { 
            username: options.username,
            password: hashPassword 
        })
        await em.persistAndFlush(user);
        return user;
    }
}
