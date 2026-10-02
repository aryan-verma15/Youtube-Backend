import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
    try {
        const dbConnection = await mongoose.connect(
            `${process.env.MONGODB_URL}/${DB_NAME}`,
        );

        console.log(
            `\n MongoDB connected Successfully !!! DB Host : ${dbConnection.connection.host}`,
        );
    } catch (error) {
        console.log('MongoDB Connection Failed : ', error);
        process.exit(1);
    }
};

export default connectDB;
