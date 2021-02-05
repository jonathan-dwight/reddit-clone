import { MyContext } from "../types";
import { User } from "../entities/User";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from 'argon2';


@InputType()
class UsernamePasswordInput {
    @Field(() => String)
    username: string
    @Field(() => String)
    password: string
}

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}


@ObjectType()
class UserResponse {
    // return user or errors if present
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[]

    @Field(() => User, { nullable: true })
    user?: User
}


@Resolver()
export class UserResolver {
    @Query(() => User, { nullable: true })
    async me(
        @Ctx() { req, em }: MyContext
    ) {
        if (!req.session.userId) {
            return null;
        }

        const user = await em.findOne(User, { id: req.session.userId })
        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        // this is if type-graphQL doesnt infer, just put it like this
        @Arg("options", () => UsernamePasswordInput)
        options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {

        if (options.username.length <= 2) {
            return {
                errors: [{
                    field: "username",
                    message: "length must be greater than 2"
                }]
            }
        }
        if (options.username.length <= 2) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "length must be greater than 2",
                    },
                ],
            };
        }

        const hashPassword = await argon2.hash(options.password);
        const user = em.create(User, {
            username: options.username,
            password: hashPassword,
        });

        try {
            await em.persistAndFlush(user);
        } catch(error) {
            if (error.code === "23505" || error.detail.includes('already exists')) {
                // duplicate username errpr
                return {
                    errors: [{
                        field: 'username',
                        message: 'username already taken'
                    }]
                }
            }
            console.log('message: ', error.message)
        }

        // store user id
        // set a cookie on the user
        // keep them logged in
        req.session!.userId = user.id;
        // this allows us to put anything in the cookie

        return { user }
    }

    @Mutation(() => UserResponse)
    async login(
        // this is if type-graphQL doesnt infer, just put it like this
        @Arg("options", () => UsernamePasswordInput)
        options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, { username: options.username })
        if (!user) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "username doesn't exist"
                    },
                ]
            }
        }
        const valid = await argon2.verify(user.password, options.password);
        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "incorrect password"
                    },
                ]
            };
        }

        req.session!.userId = user.id;

        return {
            user,
        };
    }
}


