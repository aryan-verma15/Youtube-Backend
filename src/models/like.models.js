import mongoose, { Schema } from 'mongoose';

// likes [icon: thumbs-up, color: yellow] {
//   _id string pk
//   video ObjectID videos
//   comment ObjectID comments
//   tweet ObjectID tweets
//   likedBy ObjectID users
//   createdAt date
//   updatedAt date
// }

const likeSchema = new Schema(
    {
        video: {
            type: Schema.Types.ObjectId,
            ref: 'Video',
        },
        comment: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
        },
        tweet: {
            type: Schema.Types.ObjectId,
            ref: 'Tweet',
        },
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true },
);

export const Like = mongoose.model('Like', likeSchema);
