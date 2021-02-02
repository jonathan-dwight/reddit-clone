import { Post } from './entities/Post';
import { __prod__ } from './constants';
import { MikroORM } from "@mikro-orm/core"
import path from 'path';
import { User } from './entities/User';

// will change the path for debug because its super weird 
export default {
    migrations: {
        path: path.join(__dirname, "./migrations"),
        pattern: /^[\w-]+\d+\.[tj]s$/,
    },
    entities: [Post, User],
    dbName: "reddit-clone",
    type: "postgresql",
    debug: process.env.NODE_ENV !== "production",
    // MIGHT NEED THIS
    // user: "",
    // password: ""
} as Parameters<typeof MikroORM.init>[0];