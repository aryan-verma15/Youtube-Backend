import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.models.js';
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from '../utils/cloduinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        //small check for user existance
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            'Something went wrong while genrating access and refresh tokens',
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    //validation
    if (
        [fullName, email, username, password].some(
            (field) => field?.trim() === '',
        )
    ) {
        throw new ApiError(400, 'All fields are required');
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });
    
    if (existedUser) {
        throw new ApiError(409, 'User with email or username already exists');
    }

    console.warn(req.files);
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImgLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar file is missing');
    }

    // const avatar = await uploadOnCloudinary(avatarLocalPath)

    // let coverImage = ""
    // if (coverImgLocalPath) {
    //     coverImage = await uploadOnCloudinary(coverImgLocalPath)
    // }

    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath);
        console.log('Uploaded avatar : ', avatar);
    } catch (error) {
        console.log('Error in uploading Avatar : ', error);
        throw new ApiError(500, 'Falied to upload avatar');
    }

    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverImgLocalPath);
        console.log('Uploaded CoverImage : ', coverImage);
    } catch (error) {
        console.log('Error in uploading CoverImage : ', error);
        throw new ApiError(500, 'Falied to upload CoverImage');
    }

    try {
        const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || '',
            email,
            password,
            username: username.toLowerCase(),
        });

        const createdUser = await User.findById(user._id).select(
            '-password -refreshToken',
        );

        if (!createdUser) {
            throw new ApiError(
                500,
                'Something went wrong while registration of user',
            );
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    200,
                    createdUser,
                    'User registred successfully',
                ),
            );
    } catch (error) {
        console.log('User Creation failed');

        if (avatar) {
            await deleteFromCloudinary(avatar.public_id);
        }
        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id);
        }

        throw new ApiError(
            500,
            'Something went wrong while registration of user and images are deleted',
        );
    }
});

const loginUser = asyncHandler(async (req, res) => {
    //get data from body
    // console.log("request : ", req.body)
    const { email, username, password } = req.body;

    //validation
    if (!email) {
        throw new ApiError(400, 'Email is required');
    }
    if (!password) {
        throw new ApiError(400, 'Password is required');
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    //validate passowrd
    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, 'Invalid Password');
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id,
    );
    // console.log("accessToken : ", accessToken)
    // console.log("refreshToken : ", refreshToken)

    const loggedInUser = await User.findById(user._id).select(
        '-password -refreshToken',
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                'User logged in successfully',
            ),
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    // console.log("refreshToken from body : ", req.body.refreshToken)
    // console.log("refreshToken from cookie : ", req.cookies.refreshToken)
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;
    console.log(incomingRefreshToken);

    if (!incomingRefreshToken) {
        throw new ApiError(401, 'Refresh token is required');
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, 'Invalid Refresh Token');
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'Invalid refresh token');
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        };

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken,
                    },
                    'Access token refreshed successfully',
                ),
            );
    } catch (error) {
        throw new ApiError(
            500,
            'Something went wrong while refreshing access token',
        );
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        { new: true },
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Incorrect Password');
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password Chnaged Successfully'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, 'Current user details'));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName) {
        throw new ApiError(400, 'Fullname is required');
    }
    if (!email) {
        throw new ApiError(400, 'Emial is required');
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email,
            },
        },
        { new: true },
    ).select('-password -refreshToken');

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, 'Account details successfully updated'),
        );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, 'File is required');
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError('Something went wrong while uploading avatar');
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            },
        },
        { new: true },
    ).select('-password -refreshToken');

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Avatar successfully updated'));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImgLocalPath = req.file?.path;

    if (!coverImgLocalPath) {
        throw new ApiError(400, 'File is required');
    }

    const coverImage = await uploadOnCloudinary(coverImgLocalPath);

    if (!coverImage.url) {
        throw new ApiError('Something went wrong while uploading cover image');
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
            },
        },
        { new: true },
    ).select('-password -refreshToken');

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Cover Image successfully updated'));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, 'Username is missing');
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'channel',
                as: 'subscribers',
            },
        },
        {
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'subscriber',
                as: 'subscribedTo',
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: '$subscribers',
                },
                channelSubscribedToCount: {
                    $size: '$subscribedTo',
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, '$subscribers.subscriber'] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            //Project only the necessary data
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                coverImage: 1,
                email: 1,
            },
        },
    ]);

    if (!channel?.length) {
        throw new ApiError(404, 'Channel not found');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                'Channel Profile fetched successfully',
            ),
        );
});

const getUserHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'watchHistory',
                foreignField: '_id',
                as: 'watchHistory',
                pipeline: [
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
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: '$owner',
                            },
                        },
                    },
                ],
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0]?.watchHistory,
                'Watch History fetched Successfully',
            ),
        );
});

export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserHistory,
};
