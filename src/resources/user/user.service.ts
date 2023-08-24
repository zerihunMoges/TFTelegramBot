import mongoose, { Document, ObjectId } from "mongoose";
import { Favorite } from "../favorite/favorite.model";
import { IUser, User } from "./user.model";

export async function createUser(user: IUser): Promise<
  mongoose.Document<unknown, any, IUser> &
    Omit<
      IUser & {
        _id: mongoose.Types.ObjectId;
      },
      never
    >
> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newUser = await User.create([user], { session });

    if (newUser) {
      await defaultFavorites(newUser[0].id, session);
    }

    await session.commitTransaction();
    return newUser[0];
  } catch (err) {
    console.error("Error occurred", err);
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

async function defaultFavorites(userId, session) {
  const topLeagues = [
    {
      id: 39,
      name: "Premier League",
      type: "League",
      logo: "https://media-3.api-sports.io/football/leagues/39.png",
    },

    {
      id: 140,
      name: "La Liga",
      type: "League",
      logo: "https://media-2.api-sports.io/football/leagues/140.png",
    },
    {
      id: 78,
      name: "Bundesliga",
      type: "League",
      logo: "https://media-2.api-sports.io/football/leagues/78.png",
    },
    {
      id: 135,
      name: "Serie A",
      type: "League",
      logo: "https://media-3.api-sports.io/football/leagues/135.png",
    },
    {
      id: 61,
      logo: "https://media-3.api-sports.io/football/leagues/61.png",
      name: "Ligue 1",
      type: "League",
    },
  ];

  const favoriteDocs = topLeagues.map((league) => ({
    user: userId,
    favID: league.id,
    favName: league.name,
    favImage: league.logo,
    type: "league",
  }));

  await Favorite.insertMany(favoriteDocs, { session });
}
