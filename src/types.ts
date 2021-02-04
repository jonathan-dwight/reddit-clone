import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core"
import { Request, Response } from 'express';


export type MyContext = {
    em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
    req: Request & { session: any }; // dont know why this is gettting mad -- BEN had it as session: Express.Session
    res: Response;
}