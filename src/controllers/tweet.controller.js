import mongoose, { isValidObjectId } from 'mongoose';
import { Tweet } from '../models/tweet.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';



const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body

    if (!req.user || !req.user._id) {
        throw new ApiError(
            401,
            "Unauthorized - Login to create a tweet"
        )
    }

    if (!content || content.trim() === "") {
        throw new ApiError(
            400,
            "Tweet content is missing"
        )
    }

    if(content.length > 1000) {
        throw new ApiError(
            400,
            "Tweet is too long (only 1000 characters allowed)"
        )
    }

    try {
        const newTweet = await Tweet.create({
            content,
            owner: req.user._id
        })

        if (!newTweet) {
            throw new ApiError(
                500,
                "Something went wrong while creating the tweet"
            )
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    newTweet,
                    "Tweet posted successfully!!!"
                )
            )

    } catch (error) {
        console.log("Error while creating tweet : ", error)
        throw new ApiError(
            500,
            "Something went wrong while creating the tweet"
        )
    }
});




const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params

    if (!userId?.trim()) {
        throw new ApiError(
            400,
            "UserID is missing"
        )
    }

    if (!mongoose.Types.ObjectId.isValid(userId?.trim())) {
        throw new ApiError(
            400,
            "Invalid UserID"
        )
    }

    const user = await User.findById(userId)

    if (!user) {
        throw new ApiError(
            404,
            "User did not found!!!"
        )
    }

    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 })

    if (!tweets.length) {
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    [],
                    "No tweets found for this user"
                )
            )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweets,
                "Tweets fetched successfully"
            )
        )
});




const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { newContent } = req.body

    if (!mongoose.Types.ObjectId.isValid(tweetId.trim())) {
        throw new ApiError(
            400,
            "Invalid TweetId"
        )
    }

    if (!tweetId.trim()) {
        throw new ApiError(
            400,
            "TweetId is missing"
        )
    }

    if (!newContent || newContent.trim() === "") {
        throw new ApiError(
            400,
            "Content is missing"
        )
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(
            404,
            "Tweet not found"
        )
    }

    if (tweet.owner.toString() !== req.user._id.toString().trim()) {
        throw new ApiError(
            403,
            "Unauthorized - not allowed to change tweet"
        )
    }

    tweet.content = newContent

    try {
        await tweet.save()
    } catch (error) {
        console.log("Error while updating tweet : ", error)
        throw new ApiError(
            500,
            "Error while updating tweet"
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweet,
                "Tweet updated successfully"
            )
        )
});




const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params

    if (!tweetId.trim()) {
        throw new ApiError(
            400,
            "TweetId is missing"
        )
    }

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(
            400,
            "Invalid TweetId"
        )
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(
            404,
            "Tweet not found"
        )
    }

    if (tweet.owner.toString() !== req.user._id.toString().trim()) {
        throw new ApiError(
            403,
            "Unauthorized - not allowed to delete the tweet"
        )
    }

    try {
        await tweet.deleteOne()
    } catch (error) {
        console.log("Error while deleting tweet : ", error)
        throw new ApiError(
            500,
            "Something went wrong while deleting tweet"
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweet,
                "Tweet deleted successfully"
            )
        )
});



export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
};
