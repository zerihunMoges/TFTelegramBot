import { Favorite } from "../favorite/favorite.model";
import { IUser, User } from "./user.model";

export async function createUser(user: IUser) {
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
  let newUser;
  try {
    const newUser = await User.create(user);

    if (newUser) {
      topLeagues.forEach(
        async (league) =>
          await Favorite.create({
            chatId: newUser.chatId,
            favID: league.id,
            favName: league.name,
            favImage: league.logo,
            type: "league",
          })
      );

      console.log("creating");
    }
  } catch (err) {
    console.error("error occurred ");
  }
  console.log("returned");
  return newUser;
}
