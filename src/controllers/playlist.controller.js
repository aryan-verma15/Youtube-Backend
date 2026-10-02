import mongoose, { isValidObjectId } from 'mongoose';
import { Playlist } from '../models/playlist.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.models.js';
import { Video } from '../models/video.models.js';

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    //TODO: create playlist

    if (!req.user || !req.user._id) {
        throw new ApiError(
            401,
            "Unauthorized - Login to create a playlist"
        )
    }

    if (!name || name.trim() === "") {
        throw new ApiError(
            400,
            "Playlist name is missing"
        )
    }

    if (description?.trim().length > 500) {
        throw new ApiError(
            400,
            "Description too long (max 500 characters)"
        )
    }

    const alreadyExisting = await Playlist.findOne({
        owner: req.user._id,
        name: name.trim()
    })

    if (alreadyExisting) {
        throw new ApiError(
            400,
            "You already have a playlist with this name"
        )
    }
    try {
        const newPlaylist = await Playlist.create({
            name: name.trim(),
            description: description || "",
            owner: req.user._id,
            videos: []
        })

        if (!newPlaylist) {
            throw new ApiError(
                500,
                "Something went wrong while creating the playlist"
            )
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    newPlaylist,
                    "Playlist created successfully"
                )
            )
    } catch (error) {
        console.log("Error while creating playlist : ", error)
        throw new ApiError(
            500,
            "Something went wrong while creating the playlist"
        )
    }
});




const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    //TODO: get user playlists

    if (!userId || userId.trim() === "") {
        throw new ApiError(
            400,
            "UserId is missing"
        )
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(
            400,
            "Invalid UserId"
        )
    }

    const user = await User.findById(userId)

    if (!user) {
        throw new ApiError(
            404,
            "User did not found"
        )
    }

    const userPlaylists = await Playlist.find({ owner: userId })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userPlaylists,
                userPlaylists.length ? "Playlist fetched successfully" : "User have no playlist"
            )
        )
});




const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    //TODO: get playlist by id

    if (!playlistId) {
        throw new ApiError(
            400,
            "PlaylistId is missing"
        )
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(
            400,
            "Invalid playlistId"
        )
    }

    const playlist = await Playlist
        .findById(playlistId)
        .populate("videos", "videoFile thumbnail title description duration views")
        .populate("owner", "username fullName")
        .lean()

    if (!playlist) {
        throw new ApiError(
            404,
            "Playlist not found"
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Playlist fetched successfully"
            )
        )
});




const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!playlistId) {
        throw new ApiError(
            400,
            "PlaylistId is missing"
        )
    }

    if (!videoId) {
        throw new ApiError(
            400,
            "VideoId is missing"
        )
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(
            400,
            "Invalid PlaylistId"
        )
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(
            400,
            "Invalid VideoId"
        )
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(
            404,
            "Playlist not found"
        )
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(
            404,
            "Video not found"
        )
    }

    if (!video.isPublished) {
        throw new ApiError(
            400,
            "This video is unpublished"
        )
    }

    // if (playlist.videos.includes(video._id)) {
    //     throw new ApiError(
    //         400,
    //         "Video already in playlist"
    //     )
    // }

    try {
        const result = await Playlist.updateOne(
            { _id: playlistId },
            { $addToSet: { videos: videoId } }
        );

        if (result.matchedCount === 0) {
            throw new ApiError(404, "Playlist not found");
        }

        if (result.modifiedCount === 0) {
            const existingPlaylist = await Playlist
                .findById(playlistId)
                .populate("videos", "videoFile thumbnail title description duration views")
                .populate("owner", "username fullName")
                .lean();

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        {
                            idDublicate: true,
                            playlist: existingPlaylist
                        },
                        "Video already exists in playlist"
                    )
                );
        }

        const updatedPlaylist = await Playlist
            .findById(playlistId)
            .populate("videos", "videoFile thumbnail title description duration views")
            .populate("owner", "username fullname")
            .lean()

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedPlaylist,
                    "Video added to playlist successfully"
                )
            );

    } catch (error) {
        console.log("Error while adding video to playlist : ", error)
        throw new ApiError(
            500,
            "Something went wrong while adding video to playlist"
        )
    }
});




const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    // TODO: remove video from playlist

    if (!req.user || !req.user._id) {
        throw new ApiError(
            401,
            "Unauthorized - Please login"
        )
    }

    if (!playlistId) {
        throw new ApiError(
            400,
            "PlaylistId is missing"
        )
    }

    if (!videoId) {
        throw new ApiError(
            400,
            "VideoId is missing"
        )
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(
            400,
            "Invalid PlaylistId"
        )
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(
            400,
            "Invalid VideoId"
        )
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(
            404,
            "Playlist not found"
        )
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "Forbidden - only playlist owner can remove videos"
        )
    }

    // const videoIndex = playlist.videos.findIndex(video_id => video_id.toString() === videoId.toString())

    // if(videoIndex === -1) {
    //     throw new ApiError(
    //         400,
    //         "Video not found in the playlist"
    //     )
    // }

    try {
        // playlist.videos.splice(videoIndex, 1)
        // await playlist.save()

        // const updatedPlaylist = await Playlist
        //     .findById(playlistId)
        //     .populate("videos", "videoFile thumbnail title description duration views")
        //     .populate("owner", "username", "fullname")
        //     .lean()

        const updatedPlaylist = await Playlist.findOneAndUpdate(
            { _id: playlistId, videos: videoId },
            { $pull: { videos: videoId } },
            { new: true }
        )
            .populate("videos", "videoFile thumbnail title description duration views")
            .populate("owner", "username fullName")
            .lean();

        if (!updatedPlaylist) {
            throw new ApiError(
                400,
                "Video not found in the playlist"
            )
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedPlaylist,
                    "Video removed from playlist successfully"
                )
            )

    } catch (error) {
        console.log("Error while removing video from playlist : ", error)
        throw new ApiError(
            500,
            "Something went wrong while removing video from playlist"
        )
    }
});




const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    // TODO: delete playlist

    if (!req.user || !req.user._id) {
        throw new ApiError(
            401,
            "Unauthorized - Please login"
        )
    }

    if (!playlistId) {
        throw new ApiError(
            400,
            "PlaylistId is missing"
        )
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(
            400,
            "Invalid PlaylistId"
        )
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(
            404,
            "Playlist not found"
        )
    }

    if (req.user._id.toString() !== playlist.owner.toString()) {
        throw new ApiError(
            403,
            "Forbidden - only playlist owner can delete the playlist"
        )
    }

    // await Playlist.findOneAndDelete({
    //     _id: playlistId,
    //     owner: req.user._id,
    // });  
    // return null if any of the condition not matched so its cant be confirmed that whether playlist doesnt existed or owner missmatched


    try {
        await playlist.deleteOne()
    } catch (error) {
        console.log("Error while deleting playlist : ", error)
        throw new ApiError(
            500,
            "Something went wrong while deleting playlist"
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Playlist deleted successfully"
            )
        )
});




const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    //TODO: update playlist
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
