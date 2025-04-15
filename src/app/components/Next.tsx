"use client";
import {
  Box,
  Flex,
  IconButton,
  Input,
  Popover,
  Portal,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
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
  game?: string;
  name?: string; // <- agregado
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
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<Game[]>([]);
  const [games, setGames] = useState([]);
  const { onClose, onOpen } = useDisclosure();
  const [selectedGame] = useState();

  const sensors = useSensors(useSensor(PointerSensor));

  const getAllGames = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}games`
      );
      setGames(
        response.data.sort(
          (a: { order: number }, b: { order: number }) => a.order - b.order
        )
      );
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

  const addToBacklog = async (game: Game) => {
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
        name: game?.name?.toLowerCase(),
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

  const handleDragEnd = async (event: {
    active: { id: string | number };
    over: { id: string | number } | null;
  }) => {
    const { active, over } = event;

    if (!active || !over || !over.id || active.id === over.id) return;

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
    if (selectedGame) {
      addToBacklog(selectedGame);
      handleDragEnd(selectedGame);
    }
  }, []);

  return (
    <Flex flexDirection={"column"} justifyContent={"center"}>
      <Flex justifyContent="start" alignItems="center" mb={4}>
        <Box
          m={2}
          border="2px solid transparent"
          borderRadius="full"
          transition="border-color 0.2s ease, transform 0.2s ease"
          _hover={{ cursor: "pointer", borderColor: "white" }}
          _active={{ transform: "scale(0.95)" }}
        >
          <Popover.Root>
            <Popover.Trigger>
              <IconButton
                aria-label="Add"
                backgroundColor="transparent"
                color="white"
                fontWeight="bold"
                fontSize="3xl"
                onClick={onOpen}
              >
                +
              </IconButton>
            </Popover.Trigger>
            <Portal>
              <Popover.Content bg="gray.800" color="white" p={3}>
                <Popover.Arrow />
                <Input
                  placeholder="Buscar juego"
                  size="md"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  mb={2}
                />
                {loading && (
                  <Flex justify="center" p={3}>
                    <Spinner size="sm" />
                  </Flex>
                )}
                {!loading && results.length > 0 && (
                  <Flex
                    direction="column"
                    gap={1}
                    maxH="200px"
                    overflowY="auto"
                  >
                    {results.map((game) => (
                      <Box
                        key={game.id}
                        px={3}
                        py={2}
                        _hover={{ bg: "whiteAlpha.200", cursor: "pointer" }}
                        borderRadius="md"
                        onClick={() => {
                          addToBacklog(game);
                          setQuery("");
                          setResults([]);
                          onClose();
                        }}
                      >
                        {game.name}
                      </Box>
                    ))}
                  </Flex>
                )}
                {!loading && query && results.length === 0 && (
                  <Text p={3} fontSize="sm" color="gray.400">
                    Sin resultados.
                  </Text>
                )}
              </Popover.Content>
            </Portal>
          </Popover.Root>
        </Box>

        <Text fontSize="4xl" fontWeight="bold">
          Play next:
        </Text>
      </Flex>

      <Text fontSize={"4xl"} fontWeight={"bold"}>
        Play next:
      </Text>

      {loading && <Spinner />}

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
