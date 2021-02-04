import { MikroORM } from "@mikro-orm/core";
import "reflect-metadata";
import { __prod__ } from "./constants";
import microConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";

// require('dotenv').config();

const main = async () => {
    const orm = await MikroORM.init(microConfig);
    orm.getMigrator().up();

    const app = express();

    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient();

    // can use touch to reset redis
    app.use(
        session({
            name: "qid",
            store: new RedisStore({
                client: redisClient,
                disableTouch: true,
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
                httpOnly: true,
                sameSite: "lax", // csrf
                secure: false, // cookie only works in https - switch to true in prod
            },
            saveUninitialized: false,
            secret: "asdawvfasdrfgfdgsregrdsfgsreg", // usually we want to hide this in a .env
            resave: false,
        })
    );

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false,
        }),
        context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
    });

    apolloServer.applyMiddleware({ app });

    app.listen(5000, () => {
        console.log("server started on localhost:5000");
    });
};

main().catch((err) => {
    console.log(err);
});
