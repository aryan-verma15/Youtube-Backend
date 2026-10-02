import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Configuration of Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });
        console.log('File uploaded on Cloudinary. File src: ', response.url);

        //once the file is uploaded, we will delete the file from our server
        fs.unlinkSync(localFilePath);

        return response;
    } catch (error) {
        console.log('Error on Cloudinary : ', error);
        fs.unlinkSync(localFilePath);
        return null;
    }
};

const deleteFromCloudinary = async (publicId, fileType) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: fileType,
        });
        console.log(result);
        console.log('Deleted from Cloudinary : ', publicId);
    } catch (error) {
        console.log('Error in deleting from cloudinary : ', error);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
