import { Favorite } from "../favorite/favorite.model";
import { IUser, User } from "./user.model";

export async function createUser(user: IUser): Promise<IUser> {
  let newUser: IUser;
  try {
    const newUser = await User.create(user);

    if (newUser) {
      await defaultFavorites(newUser.chatId);
    }
  } catch (err) {
    console.error("error occurred ", err);
  }
  return newUser;
}

async function defaultFavorites(userId) {
  const topLeagues = [
    {
      id: 39,
      name: "Premier League",
      type: "League",
      logo: "https://media-3.api-sports.io/football/leagues/39.png",
    },
    {
      id: 2,
      logo: "https://media-1.api-sports.io/football/leagues/2.png",
      name: "UEFA Champions League",
      type: "Cup",
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
      id: 140,
      name: "La Liga",
      type: "League",
      logo: "https://media-2.api-sports.io/football/leagues/140.png",
    },
  ];

  for (const league of topLeagues) {
    await Favorite.create({
      chatId: userId,
      favID: league.id,
      favName: league.name,
      favImage: league.logo,
      type: "league",
    });
    console.log("creating arra");
  }
  console.log("finished");
}
