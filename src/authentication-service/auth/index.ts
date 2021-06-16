import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from "helmet";
import morgan from 'morgan';
import {createConnection} from 'typeorm';
import winston from './config/winston.config';

createConnection()
  .then(async (connection) => {
    const app: express.Application = express();
    
    app.disable('x-powered-by');
    app.use(
      cors({
        origin: [process.env.FRONT_URL],
        credentials: true,
        exposedHeaders: ['Token', 'Refresh-Token', 'Client-Token', 'Content-Type'],
        methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS']
      })
    );
    app.use(helmet.contentSecurityPolicy());
    app.use(helmet.dnsPrefetchControl());
    app.use(helmet.expectCt());
    app.use(helmet.frameguard());
    app.use(helmet.hidePoweredBy());
    app.use(helmet.hsts());
    app.use(helmet.ieNoOpen());
    app.use(helmet.noSniff());
    app.use(helmet.permittedCrossDomainPolicies());
    app.use(helmet.referrerPolicy());
    app.use(helmet.xssFilter());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(morgan('combined', {stream: winston.stream}));
    

// grabs the Controller from IoC container and registers all the endpoints
    
    try {
      app.listen((process.env.PORT || 5000), () => {
        console.log(`Authentication microservice is running on port ${process.env.PORT}.`);
      });
    } catch (e) {
      console.error(e);
    }
  });
