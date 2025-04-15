"use client";
import { Flex, Text, useDisclosure } from "@chakra-ui/react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "./Card";

interface Game {
  id: string;
  title: string;
  summary: string;
  artworks: string[];
  order: number;
}

function SortableItem({ game }: { game: Game }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: game.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: "100%",
  };

  return (
    <Flex ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card title={game.title} />
    </Flex>
  );
}

function Next() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<Game[]>([]);
  const [games, setGames] = useState([]);
  const { onClose } = useDisclosure();
  const [selectedGame] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const getAllGames = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}games`
      );
      setGames(response.data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error("Error al obtener los juegos:", error);
    }
  };

  useEffect(() => {
    getAllGames();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim().length > 2) {
        setLoading(true);
        axios
          .get(`${process.env.NEXT_PUBLIC_BASE_URL}search?name=${query}`)
          .then((res) => {
            setResults(res.data);
          })
          .catch((err) => {
            console.error("Error al buscar:", err);
          })
          .finally(() => setLoading(false));
      } else {
        setResults([]);
      }
    }, 1000);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const addToBacklog = async (game: any) => {
    try {
      if (!game.artworks || game.artworks.length === 0)
        throw new Error("No artworks found");

      const artworkResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}artworks?id=${game.artworks[0]}`
      );

      if (!artworkResponse.data || artworkResponse.data.length === 0) {
        throw new Error("Artwork not found");
      }

      const backlogLength = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}games/total`
      );

      const newGame = {
        igdbId: game.id,
        name: game.name.toLowerCase(),
        summary: game.summary,
        artworks: artworkResponse.data[0].url,
        order: backlogLength.data.total + 1,
      };

      await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}games`, {
        newGame,
      });

      getAllGames();
      onClose();
    } catch (error) {
      console.error("Error al agregar el juego:", error);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = games.findIndex((g: Game) => g.id === active.id);
      const newIndex = games.findIndex((g: Game) => g.id === over.id);

      const newGames = arrayMove(games, oldIndex, newIndex);

      setGames(newGames);

      // Actualizar backend con el nuevo orden
      try {
        const updated = newGames.map((game: Game, index) => ({
          id: game.id,
          order: index + 1,
        }));

        await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}games/reorder`, {
          orderedGames: updated,
        });
      } catch (error) {
        console.error("Error al actualizar el orden:", error);
      }
    }
  };

  useEffect(() => {
    addToBacklog(selectedGame);
    handleDragEnd(selectedGame);
  }, []);

  return (
    <Flex flexDirection={"column"} justifyContent={"center"}>
      {/* Header con popover omitido por brevedad (es igual al original) */}

      <Text fontSize={"4xl"} fontWeight={"bold"}>
        Play next:
      </Text>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={games.map((g: Game) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          {games.map((game: Game) => (
            <SortableItem key={game.id} game={game} />
          ))}
        </SortableContext>
      </DndContext>
    </Flex>
  );
}

export default Next;
