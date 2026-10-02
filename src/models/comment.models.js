import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

// comments [icon: comment, color: orange] {
//   _id string pk
//   content string
//   owner string
//   video string
//   createdAt date
//   updatedAt date
// }

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: 'Video',
        },
    },
    { timestamps: true },
);

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model('Comment', commentSchema);

/* MONGOOSE AGGREGATION PIPELINE ---
→ The Mongoose Aggregation Pipeline is like the SQL of NoSQL — it lets you perform advanced data processing directly in the database! 🧠💥

🧪 What is the Aggregation Pipeline?
    → It's a series of stages that process your data step-by-step. Each stage transforms the data and passes it to the next one — like a conveyor belt 🏭.

🧱 Think of it like:
    "Take all users → filter only those with avatar → group by email domain → sort by created date"

🔄 Real Example:
Let's say you have a Video collection and you want to:
    → Only get videos with more than 1000 views
    → Group them by category
    → Count how many videos are in each category

    const result = await Video.aggregate([
    { $match: { views: { $gt: 1000 } } }, // filter
    { $group: { _id: "$category", totalVideos: { $sum: 1 } } }, // group by category
    { $sort: { totalVideos: -1 } } // sort by count descending
    ]);
*/
