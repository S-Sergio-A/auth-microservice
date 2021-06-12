import dotenv from 'dotenv';
import Mongoose from "mongoose";

dotenv.config({path: './../.env'});

let database: Mongoose.Connection;

const connect = () => {
  
  if (database) {
    return;
  }
  
  Mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });
  
  database = Mongoose.connection;
  
  database.once("open", async () => {
    console.log("Connected to database.");
  });
  
  database.on("error", () => {
    console.log("Error connecting to database!");
  });
};

const disconnect = () => {
  if (!database) {
    return;
  }
  Mongoose.disconnect();
};

export {connect, disconnect};
