import mongoose, { Schema } from "mongoose";

export interface IFavorite {
  user: mongoose.Types.ObjectId;
  type: string;
  favId: string;
  favName: string;
  favImage: string;
}

const FavoriteSchema = new mongoose.Schema({
  favId: {
    type: String,
    required: true,
  },
  favName: {
    type: String,
    required: true,
  },
  favImage: {
    type: String,
  },
  user: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  type: {
    type: String,
    enum: ["league", "club"],
    required: true,
  },
});

export const Favorite = mongoose.model<IFavorite>("Favorite", FavoriteSchema);
