import axios from "axios";
import exp from "constants";
import { config } from "../../config";

export async function getLeagues() {
  const response = await axios.get(config.apiUrl + "/leagues");

  if (response.status !== 200) {
    console.log(`Failed to fetch clubs. Status: ${response.status}`);
    return null;
  }

  const responseData = response.data;
  return responseData.response;
}

export async function getLeague(id) {
  const response = await axios.get(config.apiUrl + `/leagues/${id}`);

  if (response.status !== 200) {
    console.log(`Failed to fetch clubs. Status: ${response.status}`);
    return null;
  }

  const responseData = response.data;
  return responseData.response;
}

export async function getClubs(country: string) {
  const apiUrl = config.apiUrl + `/clubs?country=${country}`;

  const response = await axios.get(apiUrl);

  if (response.status !== 200) {
    console.log(`Failed to fetch clubs. Status: ${response.status}`);
    return null;
  }

  const responseData = response.data;
  return responseData.response;
}

export async function getClub(id: string) {
  const apiUrl = config.apiUrl + `/clubs/${id}`;

  const response = await axios.get(apiUrl);

  if (response.status !== 200) {
    console.log(`Failed to fetch clubs. Status: ${response.status}`);
    return null;
  }

  const responseData = response.data;
  return responseData.response;
}
