import mongoose, { Schema } from 'mongoose';

// subscriptions [icon: dollar-sign, color: purple] {
//   _id string pk
//   subscriber ObjectID users
//   channel ObjectID users
//   createdAt date
//   updatedAt date
// }

const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        channel: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true },
);

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
