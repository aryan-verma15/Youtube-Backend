import mongoose from 'mongoose';
import { Schema } from 'mongoose';

// playlist[color: Green] {
//   _id string pk
//   name string
//   description string
//   owner ObjectID users
//   videos ObjectID[] videos
//   createdAt date
//   updatedAt date
// }

const playlistSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        videos: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Video',
            },
        ],
    },
    { timestamps: true },
);

export const Playlist = mongoose.model('Playlist', playlistSchema);
