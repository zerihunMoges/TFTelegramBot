import mongoose, { Schema } from "mongoose";

export interface IFavorite {
  user: mongoose.Types.ObjectId;
  type: string;
  fav: any;
}

const FavoriteSchema = new mongoose.Schema({
  favID: {
    type: String,
  },
  favName: {
    type: String,
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
