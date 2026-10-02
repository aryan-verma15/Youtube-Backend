import dotenv from 'dotenv';
import { app } from './app.js';
import connectDB from './db/index.js';

dotenv.config({
    //  read the .env file and load env variables
    path: './.env',
});

const PORT = process.env.PORT || 7000;
// process.env.variable_name -> to get a variable from env

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is Online on PORT : ${PORT}`);
        });
    })
    .catch((error) => {
        console.log('MongoDB Connection Error ', error);
    });
