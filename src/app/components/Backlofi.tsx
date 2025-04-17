// components/GameManager.tsx
"use client";
import React, { useEffect, useState, useCallback } from "react";
import NowPlaying from "./NowPlaying";
import Next from "./Next";
import axios from "axios";

function GameManager() {
  const [games, setGames] = useState([]);

  const getAllGames = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}games`
      );
      const sorted = response.data.sort((a, b) => a.order - b.order);
      setGames(sorted);
    } catch (error) {
      console.error("Error al obtener los juegos:", error);
    }
  }, []);

  useEffect(() => {
    getAllGames();
  }, [getAllGames]);

  return (
    <>
      <NowPlaying onFinish={getAllGames} />
      <Next games={games} refreshGames={getAllGames} />
    </>
  );
}

export default GameManager;
