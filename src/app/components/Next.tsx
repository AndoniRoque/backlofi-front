"use client";
import {
  Box,
  Button,
  Flex,
  Input,
  Image,
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
import { FiPlus, FiSearch, FiShuffle } from "react-icons/fi";
import axios from "axios";
import Card from "./Card";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  cover?: { url?: string };
  first_release_date?: number;
  genres?: { name: string }[];
  platforms?: { name: string }[];
}

type Feedback = {
  tone: "success" | "error" | "saving";
  message: string;
};

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
        artworkId={game.artworks?.[0]}
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
  const [searchError, setSearchError] = useState(false);
  const [genreFilter, setGenreFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [results, setResults] = useState<SearchGame[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isSorting, setIsSorting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<Game | null>(null);
  const [undoRemoval, setUndoRemoval] = useState<Game | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const { open, onClose, onOpen } = useDisclosure();
  const sensors = useSensors(useSensor(PointerSensor));
  const currentGame = games.find((game) => game.playStatus === "PLAYING");
  const queuedGames = games.filter((game) => game.playStatus === "BACKLOG");
  const availableGenres = Array.from(
    new Set(
      results.flatMap((game) => game.genres?.map((genre) => genre.name) || []),
    ),
  ).sort();
  const availablePlatforms = Array.from(
    new Set(
      results.flatMap(
        (game) => game.platforms?.map((platform) => platform.name) || [],
      ),
    ),
  ).sort();
  const filteredResults = results.filter((game) => {
    const matchesGenre =
      !genreFilter || game.genres?.some((genre) => genre.name === genreFilter);
    const matchesPlatform =
      !platformFilter ||
      game.platforms?.some((platform) => platform.name === platformFilter);
    return matchesGenre && matchesPlatform;
  });

  const showFeedback = useCallback((nextFeedback: Feedback) => {
    setFeedback(nextFeedback);
  }, []);

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
    const controller = new AbortController();
    const delayDebounce = setTimeout(() => {
      if (query.trim().length > 2) {
        setLoading(true);
        setSearchError(false);
        axios
          .get(
            `${process.env.NEXT_PUBLIC_BASE_URL}search?name=${encodeURIComponent(query.trim())}`,
            { signal: controller.signal },
          )
          .then((res) => setResults(res.data))
          .catch((error) => {
            if (controller.signal.aborted) return;
            console.error("Error al buscar:", error);
            setResults([]);
            setSearchError(true);
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          });
      } else {
        setResults([]);
        setSearchError(false);
      }
    }, 500);

    return () => {
      clearTimeout(delayDebounce);
      controller.abort();
    };
  }, [query]);

  const addToBacklog = async (game: SearchGame) => {
    if (games.some((existingGame) => existingGame.igdbId === game.id)) return;

    setAddingId(game.id);
    showFeedback({ tone: "saving", message: "Adding game..." });
    try {
      const backlogLength = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}games/total`,
      );

      await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}games`, {
        newGame: {
          igdbId: game.id,
          name: game.name,
          summary: game.summary || "Sin resumen disponible.",
          artworks: game.artworks || [],
          order: backlogLength.data.total + 1,
        },
      });

      await refreshGames();
      setQuery("");
      setResults([]);
      setGenreFilter("");
      setPlatformFilter("");
      onClose();
      showFeedback({
        tone: "success",
        message: `${game.name} added to the queue.`,
      });
    } catch (error) {
      console.error("Error al agregar el juego:", error);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        showFeedback({
          tone: "error",
          message: "That game is already in your library.",
        });
      } else {
        showFeedback({ tone: "error", message: "Could not add that game." });
      }
    } finally {
      setAddingId(null);
    }
  };

  const persistOrder = async (orderedGames: Game[]) => {
    return axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}games/reorder`, {
      orderedGames: orderedGames.map((game, index) => ({
        id: game.id,
        order: index + 1,
      })),
    });
  };

  const applyLocalOrder = (orderedGames: Game[]) => {
    setGames(
      orderedGames.map((game, index) => ({
        ...game,
        orden: index + 1,
        playStatus: index === 0 ? "PLAYING" : "BACKLOG",
      })),
    );
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

    const reorderedQueue = arrayMove(queuedGames, oldIndex, newIndex);
    const orderedGames = currentGame
      ? [currentGame, ...reorderedQueue]
      : reorderedQueue;

    applyLocalOrder(orderedGames);
    setIsReordering(true);
    showFeedback({ tone: "saving", message: "Saving queue order..." });
    try {
      await persistOrder(orderedGames);
      showFeedback({ tone: "success", message: "Queue order saved." });
    } catch (error) {
      console.error("Error al actualizar el orden:", error);
      await refreshGames();
      showFeedback({
        tone: "error",
        message: "Could not save the queue order.",
      });
    } finally {
      setIsReordering(false);
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
    applyLocalOrder(shuffledGames);
    showFeedback({ tone: "saving", message: "Saving the next game..." });
    try {
      await persistOrder(shuffledGames);
      showFeedback({
        tone: "success",
        message: `${randomGame.title} is next.`,
      });
    } catch (error) {
      console.error("Error al sortear el próximo juego:", error);
      setSelectedGame(null);
      await refreshGames();
      showFeedback({
        tone: "error",
        message: "Could not save the selected game.",
      });
    } finally {
      setIsSorting(false);
    }
  };

  const requestRemove = (game: Game) => {
    setPendingRemoval(game);
    setUndoRemoval(null);
  };

  const confirmRemove = async () => {
    if (!pendingRemoval) return;

    const game = pendingRemoval;
    setPendingRemoval(null);
    setIsRemoving(true);
    showFeedback({ tone: "saving", message: `Removing ${game.title}...` });
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}games`, {
        data: { igdbId: game.igdbId },
      });
      setGames((currentGames) =>
        currentGames.filter((currentGame) => currentGame.id !== game.id),
      );
      setUndoRemoval(game);
      showFeedback({
        tone: "success",
        message: `${game.title} removed from the queue.`,
      });
      window.setTimeout(() => {
        setUndoRemoval((currentGame) =>
          currentGame?.id === game.id ? null : currentGame,
        );
      }, 6000);
    } catch (error) {
      console.error("Error al quitar el juego:", error);
      await refreshGames();
      showFeedback({ tone: "error", message: "Could not remove that game." });
    } finally {
      setIsRemoving(false);
    }
  };

  const undoRemove = async () => {
    if (!undoRemoval) return;

    const game = undoRemoval;
    setUndoRemoval(null);
    showFeedback({ tone: "saving", message: `Restoring ${game.title}...` });
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}games`, {
        newGame: {
          igdbId: game.igdbId,
          name: game.title,
          summary: game.synopsis || "Sin resumen disponible.",
          artworks: game.artworks || [],
          order: game.orden,
        },
      });
      await refreshGames();
      showFeedback({ tone: "success", message: `${game.title} restored.` });
    } catch (error) {
      console.error("Error al restaurar el juego:", error);
      await refreshGames();
      showFeedback({ tone: "error", message: "Could not restore that game." });
    }
  };

  return (
    <Flex flexDirection="column" justifyContent="center" w="full" maxW="600px">
      <Flex justifyContent="space-between" alignItems="center" mb={5} gap={3}>
        <DialogRoot
          open={open}
          onOpenChange={(details) => (details.open ? onOpen() : onClose())}
          size="lg"
          placement="center"
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" p={4}>
              <FiPlus />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent
            bg="gray.800"
            color="white"
            p={4}
            w="full"
            maxW="560px"
            maxH="calc(100vh - 32px)"
            overflow="hidden"
          >
            <DialogHeader p={1}>
              <DialogTitle>Add game</DialogTitle>
            </DialogHeader>
            <DialogBody
              display="flex"
              flexDirection="column"
              p={1}
              overflow="hidden"
            >
              <Flex alignItems="center" gap={2} mb={3} flexShrink={0}>
                <Box color="whiteAlpha.600">
                  <FiSearch />
                </Box>
                <Input
                  autoFocus
                  placeholder="Search title..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  px={2}
                />
              </Flex>
              {(availableGenres.length > 0 ||
                availablePlatforms.length > 0) && (
                <Flex gap={2} mb={3} px={2}>
                  <select
                    value={genreFilter}
                    onChange={(event) => setGenreFilter(event.target.value)}
                    style={{
                      flex: 1,
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "white",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "12px",
                    }}
                  >
                    <option value="" style={{ background: "#1a202c" }}>
                      All genres
                    </option>
                    {availableGenres.map((genre) => (
                      <option
                        key={genre}
                        value={genre}
                        style={{ background: "#1a202c" }}
                      >
                        {genre}
                      </option>
                    ))}
                  </select>
                  <select
                    value={platformFilter}
                    onChange={(event) => setPlatformFilter(event.target.value)}
                    style={{
                      flex: 1,
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "white",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "12px",
                    }}
                  >
                    <option value="" style={{ background: "#1a202c" }}>
                      All platforms
                    </option>
                    {availablePlatforms.map((platform) => (
                      <option
                        key={platform}
                        value={platform}
                        style={{ background: "#1a202c" }}
                      >
                        {platform}
                      </option>
                    ))}
                  </select>
                </Flex>
              )}
              <Box minH="120px" overflow="hidden">
                {query.trim().length > 0 && query.trim().length < 3 && (
                  <Text color="whiteAlpha.600" fontSize="sm" px={2} py={3}>
                    Type three characters or more to search.
                  </Text>
                )}
                {loading && (
                  <Flex alignItems="center" gap={2} px={2} py={3}>
                    <Spinner size="sm" />
                    <Text fontSize="sm" color="whiteAlpha.700">
                      Searching database...
                    </Text>
                  </Flex>
                )}
                {!loading && filteredResults.length > 0 && (
                  <Flex
                    direction="column"
                    gap={1}
                    maxH={{ base: "calc(100vh - 220px)", sm: "320px" }}
                    overflowY="auto"
                    p={2}
                  >
                    {filteredResults.map((game) => (
                      <Flex
                        key={game.id}
                        alignItems="center"
                        gap={3}
                        p={4}
                        borderRadius="md"
                        _hover={{ bg: "whiteAlpha.200" }}
                      >
                        {game.cover?.url ? (
                          <Image
                            src={`https:${game.cover.url.replace("t_thumb", "t_cover_small")}`}
                            alt=""
                            w="40px"
                            h="52px"
                            objectFit="cover"
                            borderRadius="sm"
                          />
                        ) : (
                          <Flex
                            w="40px"
                            h="52px"
                            bg="whiteAlpha.200"
                            borderRadius="sm"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <FiSearch />
                          </Flex>
                        )}
                        <Box flex="1" minW={0}>
                          <Text
                            fontWeight="bold"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                          >
                            {game.name}
                          </Text>
                          <Text fontSize="xs" color="whiteAlpha.600">
                            {game.first_release_date
                              ? new Date(
                                  game.first_release_date * 1000,
                                ).getFullYear()
                              : "Año desconocido"}
                          </Text>
                          {(game.genres?.length || game.platforms?.length) && (
                            <Text
                              fontSize="xs"
                              color="whiteAlpha.500"
                              overflow="hidden"
                              textOverflow="ellipsis"
                              whiteSpace="nowrap"
                            >
                              {[
                                ...(game.genres || []).map(
                                  (genre) => genre.name,
                                ),
                                ...(game.platforms || [])
                                  .slice(0, 2)
                                  .map((platform) => platform.name),
                              ].join(" · ")}
                            </Text>
                          )}
                        </Box>
                        <Button
                          size="xs"
                          variant="ghost"
                          loading={addingId === game.id}
                          disabled={games.some(
                            (existingGame) => existingGame.igdbId === game.id,
                          )}
                          onClick={() => addToBacklog(game)}
                          p={4}
                        >
                          {games.some(
                            (existingGame) => existingGame.igdbId === game.id,
                          )
                            ? "In queue"
                            : "Add"}
                        </Button>
                      </Flex>
                    ))}
                  </Flex>
                )}
                {!loading && searchError && (
                  <Text p={3} fontSize="sm" color="red.300">
                    The search couldn&apos;t be completed. Please try again.
                  </Text>
                )}
                {!loading &&
                  !searchError &&
                  query.trim().length > 2 &&
                  filteredResults.length === 0 && (
                    <Text p={3} fontSize="sm" color="gray.400">
                      No results found.
                    </Text>
                  )}
              </Box>
            </DialogBody>
            <DialogCloseTrigger />
          </DialogContent>
        </DialogRoot>

        <Flex alignItems="center" gap={3} flex="1">
          <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
            Play Next
          </Text>
          <Text color="whiteAlpha.600" fontSize="sm" whiteSpace="nowrap">
            {queuedGames.length} in queue
          </Text>
        </Flex>

        <Button
          size="sm"
          variant="outline"
          colorPalette="yellow"
          loading={isSorting}
          disabled={games.length < 2}
          onClick={shuffleNext}
          p={4}
        >
          <FiShuffle />
          Random game
        </Button>
      </Flex>

      <Flex minH="24px" alignItems="center" mb={2} px={1} role="status">
        {feedback && (
          <Flex alignItems="center" gap={2}>
            {feedback.tone === "saving" && <Spinner size="xs" />}
            <Text
              fontSize="xs"
              color={
                feedback.tone === "error"
                  ? "red.300"
                  : feedback.tone === "success"
                    ? "green.300"
                    : "whiteAlpha.600"
              }
            >
              {feedback.message}
            </Text>
            {undoRemoval && (
              <Button
                size="xs"
                variant="ghost"
                colorPalette="yellow"
                onClick={undoRemove}
              >
                Undo
              </Button>
            )}
          </Flex>
        )}
      </Flex>

      {pendingRemoval && (
        <Flex
          alignItems="center"
          justifyContent="space-between"
          gap={3}
          mb={3}
          px={3}
          py={2}
          border="1px solid"
          borderColor="red.700"
          borderRadius="md"
          bg="red.950"
        >
          <Text
            fontSize="sm"
            minW={0}
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            Remove <strong>{pendingRemoval.title}</strong> from the queue?
          </Text>
          <Flex gap={2} flexShrink={0}>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setPendingRemoval(null)}
            >
              Cancel
            </Button>
            <Button
              size="xs"
              colorPalette="red"
              loading={isRemoving}
              onClick={confirmRemove}
            >
              Remove
            </Button>
          </Flex>
        </Flex>
      )}

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
            Hide
          </Button>
        </Flex>
      )}

      {queuedGames.length === 0 && (
        <Text color="whiteAlpha.600" py={8} textAlign="center">
          Queue is empty. Add games to your backlog to see them here.
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
                onRemove={requestRemove}
              />
            ))}
          </Flex>
        </SortableContext>
      </DndContext>
    </Flex>
  );
}

export default Next;
