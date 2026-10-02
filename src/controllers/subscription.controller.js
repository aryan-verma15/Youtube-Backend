import mongoose, { isValidObjectId } from 'mongoose';
import { User } from '../models/user.model.js';
import { Subscription } from '../models/subscription.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';



const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    // TODO: toggle subscription

    if (!channelId || channelId.trim() === "") {
        throw new ApiError(
            400,
            "ChannelId is missing"
        )
    }

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(
            400,
            "Invalid ChannelId"
        )
    }

    const channel = await User.findById(channelId)

    if (!channel) {
        throw new ApiError(
            404,
            "Channel not found"
        )
    }

    const doesAlreadySubscribed = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if (doesAlreadySubscribed) {
        try {
            await doesAlreadySubscribed.deleteOne()

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        {
                            isSubscribed: false,
                            unSubscriptionData: doesAlreadySubscribed
                        },
                        "Unsubscribed Successfully"
                    )
                )
        } catch (error) {
            console.log("Error while unsubscribing : ", error)
            throw new ApiError(
                500,
                "Something went wrong while unsubscribing"
            )
        }
    } else {
        try {
            const newSubscription = await Subscription.create({
                subscriber: req.user._id,
                channel: channelId
            })

            return res
                .status(201)
                .json(
                    new ApiResponse(
                        201,
                        {
                            isSubscribed: true,
                            subscriptionData: newSubscription
                        },
                        "Subscribed Successfully"
                    )
                )
        } catch (error) {
            console.log("Error while subscribing : ", error)
            throw new ApiError(
                500,
                "Something went wrong while subscribing"
            )
        }
    }
});




// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId || channelId.trim() === "") {
        throw new ApiError(
            400,
            "ChannelId is Missing"
        )
    }

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(
            400,
            "Invalid channelId"
        )
    }

    const channel = await User.findById(channelId)

    if (!channel) {
        throw new ApiError(
            404,
            "Channel does not found"
        )
    }

    const subscribers = await Subscription
        .find({ channel: channelId })
        .populate("subscriber", "username fullName")
        .select("subscriber")
        .sort({ createdAt: -1 })
        .lean()  // to remove internal methods given by mongoDB and save memory as well as make response fast

    // const subscriberCount = subscribers.length   // unoptimized for big document 
    const subscribersList = subscribers.map(sub => sub.subscriber);
    const subscriberCount = await Subscription.countDocuments({ channel: channelId })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    subscribers: subscribersList,
                    subscriberCount: subscriberCount
                },
                "Subscribers fetched successfully"
            )
        )
});




// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!subscriberId || subscriberId.trim() === "") {
        throw new ApiError(
            400,
            "SubscriberId is missing"
        )
    }

    if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
        throw new ApiError(
            400,
            "Invalid SubscriberId"
        )
    }

    const subscriber = await User.findById(subscriberId)

    if (!subscriber) {
        throw new ApiError(
            404,
            "Subscriber does not found"
        )
    }

    const subscribedTo = await Subscription
        .find({ subscriber: subscriberId })
        .populate("channel", "username fullName")
        .select("channel")
        .sort({ createdAt: -1 })
        .lean() 

    const subscribedToCount = await Subscription.countDocuments({ subscriber: subscriberId })
    const subscribedToList = subscribedTo.map(sub => sub.channel)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    subscribedTo: subscribedToList,
                    subscribedToCount: subscribedToCount
                },
                "User subsription fetched successfully"
            )
        )
});



export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
