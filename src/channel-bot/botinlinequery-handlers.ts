import { InlineKeyboardMarkup, InlineQueryResult } from "telegraf/types";
import { getClubs, getLeagues } from "./botservice";
import { Markup } from "telegraf";
import { off } from "process";
import { Club } from "../types/club.type";

export async function handleClubsQuery(
  country: string,
  limit: number,
  offset: number,
  actualQuery: string
): Promise<InlineQueryResult[]> {
  if (!country || country.trim().length == 0) {
    return [];
  }

  const responseData = await getClubs(country);
  const response = responseData
    .filter(
      (data) =>
        data.team.name.toLowerCase().includes(actualQuery.toLowerCase()) ||
        data.team.country.toLowerCase().includes(actualQuery.toLowerCase())
    )
    .slice(offset, offset + limit);

  return response?.map(({ team, venue }: Club): InlineQueryResult => {
    return {
      type: "article",
      id: `club ${team.id.toString()}`,
      title: team.name,
      description: team.national
        ? `${team.name} National Team`
        : team.founded.toString(),
      thumb_url: team.logo,

      input_message_content: {
        message_text: `Selected ${team.name}`,
        parse_mode: "HTML",
      },
    };
  });
}

export async function handleLeaguesQuery(
  limit: number,
  offset: number,
  actualQuery: string
) {
  const responseData = await getLeagues();
  const response = responseData
    .filter(
      (data) =>
        data.league.name.toLowerCase().includes(actualQuery.toLowerCase()) ||
        data.country.name.toLowerCase().includes(actualQuery.toLowerCase())
    )
    .slice(offset, offset + limit);

  return response?.map(
    ({ league, country, seasons }: any): InlineQueryResult => {
      return {
        type: "article",
        id: `league ${league.id}`,
        title: league.name,
        description: country.name,
        thumb_url: league.logo,

        input_message_content: {
          message_text: `Selected ${league.name}`,

          parse_mode: "HTML",
        },
      };
    }
  );
}

export function extractQuery(query: string) {
  let type = "";
  let country = "";
  let actualQuery = "";

  console.log(query, query.toLowerCase(), query.split(" "));
  if (query.toLowerCase().startsWith("#leagues")) {
    const [tag, ...rest] = query.split(" ");
    type = tag;
    actualQuery = rest.join(" ");
  } else if (query.toLowerCase().startsWith("#clubs")) {
    let [tag, countrytemp, ...rest] = query.split(" ");
    type = tag;
    country = countrytemp;
    actualQuery = rest.join(" ");
  } else {
    type = "#Leagues";
    actualQuery = query;
  }

  return { type, country, actualQuery };
}
