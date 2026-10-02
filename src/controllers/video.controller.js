import mongoose, { isValidObjectId } from 'mongoose';
import { Video } from '../models/video.models.js';
import { User } from '../models/user.models.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from '../utils/cloduinary.js';



const getAllVideos = asyncHandler(async (req, res) => {
    //TODO: get all videos based on query, sort, pagination
    let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    page = parseInt(page)
    limit = parseInt(limit)

    let filters = {}
    if(query && query.trim() !== "") {
        filters.$or = [
            {title: { $regex: query, $options: "i" }},
            {description: { $regex: query, $options: "i" }}
        ]
    }
    filters.isPublished = true
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        filters.owner = userId;  
    }

    const sortOptions = {}
    sortBy = sortBy || "views";
    sortType = sortType || "desc";
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1

    const totalVideos = await Video.countDocuments(filters)

    const videos = await Video.find(filters)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("owner", "username fullname avatar" )
        .select("title description duration views createdAt owner")

    res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                pegination: {
                    totalVideos,
                    currentPage: page,
                    totalPages: Math.ceil(totalVideos / limit),
                    limit
                }
            },
            "Videos fetched successfully!!!"
        )
    )
});




const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video

    if (!title) {
        throw new ApiError(400, 'Video Title is missing');
    }

    // console.log("title : ", title)
    // console.log("description : ", description)

    const videoLocalPath = req.files?.video?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, 'Video is missing');
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, 'Thumbnail is missing');
    }

    let video;
    try {
        video = await uploadOnCloudinary(videoLocalPath);
        console.log('Uploaded video : ', video);
    } catch (error) {
        console.log('Error in Uploading ViDEO : ', error);
        throw new ApiError(500, 'Failed to upload video');
    }

    let thumbnail;
    try {
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        console.log('Uploaded thumbnail : ', thumbnail);
    } catch (error) {
        console.log('Error in Uploading thumbnail : ', error);
        throw new ApiError(500, 'Failed to upload thumbnail');
    }

    try {
        const newVideo = await Video.create({
            videoFile: video.url,
            thumbnail: thumbnail.url,
            title,
            description: description || '',
            duration: video.duration,
            owner: req.user._id,
        });

        console.log(newVideo);

        const uploadedVideo = await Video.findById(newVideo._id);

        if (!uploadedVideo) {
            throw new ApiError(
                500,
                'Something went wrong while uploading videos',
            );
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    200,
                    uploadedVideo,
                    'Video Uploaded Successfully',
                ),
            );
    } catch (error) {
        console.log('Falied to upload video');
        // console.log("Error : ", error)

        if (video) {
            await deleteFromCloudinary(video.public_id, 'video');
        }
        if (thumbnail) {
            await deleteFromCloudinary(thumbnail.public_id, 'image');
        }

        throw new ApiError(500, 'Something went wrong while uploading video');
    }
});




const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id
    const { videoId } = req.params;
    if (!videoId.trim()) {
        throw new ApiError(400, 'VideoId is missing');
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner',
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                            coverImage: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: '$owner',
        },
    ]);

    if (!video?.length) {
        throw new ApiError(404, 'Video not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], 'Video fetched successfully'));
});



const getPublicID = (url) => {
    const urlParts = url.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const public_id = fileName.split('.')[0]
    return public_id
}



const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params;
    const { newTitle, newDescription } = req.body;
    const newThumbnailPath = req.file?.path;
    
    // console.log(newThumbnailPath)

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }


    if(!newTitle && !newDescription && !newThumbnailPath) {
        throw new ApiError(400, "Nothing provided to update")
    }

    // console.log(newTitle)
    // console.log(newDescription)
    // console.log(newThumbnailPath)
    // console.log(videoId)

    const video = await Video.findById(videoId)
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized - not allowed to change video details");
    }

    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    if(newTitle) {
        video.title = newTitle
    }

    if(newDescription) {
        video.description = newDescription
    }

    let newThumbnail
    let oldThumbnail
    if(newThumbnailPath) {
        newThumbnail = await uploadOnCloudinary(newThumbnailPath)
        if(!newThumbnail) {
            throw new ApiError(500, "Failed to upload Thumbnail")
        }

        oldThumbnail = video.thumbnail
        video.thumbnail = newThumbnail.url
        console.log("New Thumbnail : ", newThumbnail)
    }

    try {
        await video.save()

        if (oldThumbnail) {
            const public_id = getPublicID(oldThumbnail)
            await deleteFromCloudinary(public_id, 'image')
        }
    } catch (error) {
        console.log(error)
        if (newThumbnail?.public_id) {
            await deleteFromCloudinary(newThumbnail.public_id, "image");
        }
        throw new ApiError(500, "Failed to update to database")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Video updated successfully"
            )
        )
});




const deleteVideo = asyncHandler(async (req, res) => {
    //TODO: delete video
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    if(video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized - not allowed to delete video");
    }

    const videoURL = video.videoFile
    const thumbnailURL = video.thumbnail
    const videoPublicID = getPublicID(videoURL)
    const thumbnailPublicID =  getPublicID(thumbnailURL)
    
    try {
        await video.deleteOne()
    } catch (error) {
        console.log(error)
        throw new ApiError(400, "Somthing went wrong while deleting video")
    }

    await deleteFromCloudinary(videoPublicID, 'video')
    await deleteFromCloudinary(thumbnailPublicID, 'image')

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Video deleted successsfully"
            )
        )
});




const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid VideoId")
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    if(video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized - not allowed to make changes");
    }

    video.isPublished = !video.isPublished

    try {
        await video.save()
    } catch (error) {
        throw new ApiError(400, "Somthing went wrong")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                video.isPublished ? "Video published successfully" : "Video is now unpublished"
            )
        )
});



export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
