"use client";
import {
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  Popover,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  type DragEndEvent,
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
import React, { useCallback, useEffect, useState } from "react";
import { FiPlus, FiShuffle } from "react-icons/fi";
import axios from "axios";
import Card from "./Card";

interface Game {
  id: number;
  igdbId: number;
  title: string;
  synopsis?: string;
  artworks: number[];
  orden: number;
  playStatus: "PLAYING" | "BACKLOG";
}

interface SearchGame {
  id: number;
  name: string;
  summary?: string;
  artworks?: number[];
}

function SortableItem({
  game,
  position,
  onRemove,
}: {
  game: Game;
  position: number;
  onRemove: (game: Game) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: game.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: "100%",
  };

  return (
    <Flex ref={setNodeRef} style={style} w="full" {...attributes}>
      <Card
        title={game.title}
        position={position}
        onRemove={() => onRemove(game)}
        dragHandleProps={listeners}
      />
    </Flex>
  );
}

function Next({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const [games, setGames] = useState<Game[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isSorting, setIsSorting] = useState(false);
  const { onClose, onOpen } = useDisclosure();
  const sensors = useSensors(useSensor(PointerSensor));
  const currentGame = games.find((game) => game.playStatus === "PLAYING");
  const queuedGames = games.filter((game) => game.playStatus === "BACKLOG");

  const refreshGames = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}games`,
      );
      const sortedGames = response.data.sort(
        (a: Game, b: Game) => a.orden - b.orden,
      );
      setGames(sortedGames);
    } catch (error) {
      console.error("Error al obtener los juegos:", error);
    }
  }, []);

  useEffect(() => {
    refreshGames();
  }, [refreshGames, refreshTrigger]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim().length > 2) {
        setLoading(true);
        axios
          .get(`${process.env.NEXT_PUBLIC_BASE_URL}search?name=${query}`)
          .then((res) => setResults(res.data))
          .catch((error) => console.error("Error al buscar:", error))
          .finally(() => setLoading(false));
      } else {
        setResults([]);
      }
    }, 1000);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const addToBacklog = async (game: SearchGame) => {
    try {
      const backlogLength = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}games/total`,
      );

      await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}games`, {
        newGame: {
          igdbId: game.id,
          name: game.name,
          summary: game.summary,
          artworks: game.artworks || [],
          order: backlogLength.data.total + 1,
        },
      });

      refreshGames();
      setQuery("");
      setResults([]);
      onClose();
    } catch (error) {
      console.error("Error al agregar el juego:", error);
    }
  };

  const persistOrder = async (orderedGames: Game[]) => {
    await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}games/reorder`, {
      orderedGames: orderedGames.map((game, index) => ({
        id: game.id,
        order: index + 1,
      })),
    });
    refreshGames();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = queuedGames.findIndex(
      (game) => game.id === Number(active.id),
    );
    const newIndex = queuedGames.findIndex(
      (game) => game.id === Number(over.id),
    );
    if (oldIndex < 0 || newIndex < 0) return;

    try {
      const reorderedQueue = arrayMove(queuedGames, oldIndex, newIndex);
      await persistOrder(
        currentGame ? [currentGame, ...reorderedQueue] : reorderedQueue,
      );
    } catch (error) {
      console.error("Error al actualizar el orden:", error);
    }
  };

  const shuffleNext = async () => {
    if (queuedGames.length === 0) return;

    const randomGame =
      queuedGames[Math.floor(Math.random() * queuedGames.length)];
    const shuffledGames = [
      ...(currentGame ? [currentGame] : []),
      randomGame,
      ...queuedGames.filter((game) => game.id !== randomGame.id),
    ];

    setIsSorting(true);
    setSelectedGame(randomGame);
    try {
      await persistOrder(shuffledGames);
    } catch (error) {
      console.error("Error al sortear el próximo juego:", error);
      setSelectedGame(null);
    } finally {
      setIsSorting(false);
    }
  };

  const removeFromBacklog = async (game: Game) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}games`, {
        data: { igdbId: game.igdbId },
      });
      refreshGames();
    } catch (error) {
      console.error("Error al quitar el juego:", error);
    }
  };

  return (
    <Flex flexDirection="column" justifyContent="center" w="full" maxW="600px">
      <Flex justifyContent="space-between" alignItems="center" mb={5} gap={3}>
        <Popover.Root>
          <Popover.Trigger asChild>
            <IconButton
              aria-label="Agregar juego"
              backgroundColor="transparent"
              color="white"
              size="sm"
              onClick={onOpen}
            >
              <FiPlus />
            </IconButton>
          </Popover.Trigger>
          <Popover.Content bg="gray.800" color="white" p={3} zIndex="1">
            <Popover.Arrow />
            <Input
              placeholder="Buscar juego"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              mb={2}
            />
            {loading && <Spinner size="sm" />}
            {!loading && results.length > 0 && (
              <Flex direction="column" gap={1} maxH="200px" overflowY="auto">
                {results.map((game) => (
                  <Box
                    key={game.id}
                    px={3}
                    py={2}
                    borderRadius="md"
                    _hover={{ bg: "whiteAlpha.200", cursor: "pointer" }}
                    onClick={() => addToBacklog(game)}
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
        </Popover.Root>

        <Flex alignItems="center" gap={3} flex="1">
          <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
            Próximos juegos
          </Text>
          <Text color="whiteAlpha.600" fontSize="sm" whiteSpace="nowrap">
            {queuedGames.length} en cola
          </Text>
        </Flex>

        <Button
          size="sm"
          variant="outline"
          colorPalette="yellow"
          loading={isSorting}
          disabled={games.length < 2}
          onClick={shuffleNext}
        >
          <FiShuffle />
          Sortear próximo
        </Button>
      </Flex>

      {selectedGame && !isSorting && (
        <Flex
          alignItems="center"
          justifyContent="space-between"
          gap={3}
          mb={4}
          px={4}
          py={3}
          borderRadius="md"
          bg="yellow.900"
          border="1px solid"
          borderColor="yellow.600"
        >
          <Box minW={0}>
            <Text
              color="yellow.200"
              fontSize="xs"
              fontWeight="bold"
              textTransform="uppercase"
            >
              Próximo juego
            </Text>
            <Text
              fontWeight="bold"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {selectedGame.title}
            </Text>
          </Box>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setSelectedGame(null)}
          >
            Ocultar
          </Button>
        </Flex>
      )}

      {queuedGames.length === 0 && (
        <Text color="whiteAlpha.600" py={8} textAlign="center">
          La cola está vacía. Agrega juegos para empezar.
        </Text>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={queuedGames.map((game) => game.id)}
          strategy={verticalListSortingStrategy}
        >
          <Flex direction="column" gap={2}>
            {queuedGames.map((game, index) => (
              <SortableItem
                key={game.id}
                game={game}
                position={index + 2}
                onRemove={removeFromBacklog}
              />
            ))}
          </Flex>
        </SortableContext>
      </DndContext>
    </Flex>
  );
}

export default Next;
