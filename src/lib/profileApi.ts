/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "../../lib/axios";

// Atualiza getUserSongs para aceitar paginação e retornar o objeto completo
export async function getUserSongs(page = 1) {
  const res = await api.get(`/songs/?page=${page}`);
  return res.data;
}

export async function getUserSetlists() {
  const res = await api.get("/setlists/");
  return res.data.results || res.data;
}

export async function getMusicStats() {
  const res = await api.get("/songs/music-stats/");
  return res.data;
}

export async function getPersonalRanking() {
  const res = await api.get("/songs/personal-ranking/");
  return res.data;
}


export async function getUserProfile() {
  const res = await api.get("/users/me/");
  return res.data;
}

export async function updateUserProfile(id: any, data: { first_name?: string; last_name?: string }) {
  const res = await api.patch(`/users/${id}/`, data);
  return res.data;
}