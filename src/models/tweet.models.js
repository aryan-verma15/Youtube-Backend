import mongoose, { Schema } from 'mongoose';

// tweets [icon: twitter, color: blue] {
//   _id string pk
//   content string
//   owner string
//   createdAt date
//   updatedAt date
// }

const tweetSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true },
);

export const Tweet = mongoose.model('Tweet', tweetSchema);
