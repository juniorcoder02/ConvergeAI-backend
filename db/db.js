import mongoose from "mongoose";

const connectDB = async () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("MongoDb connected");
    })
    .catch((err) => {
      console.log("MongoDb connection failed", err);
    });
};

export default connectDB;