"use client";
import {
  Box,
  Button,
  Flex,
  IconButton,
  Image,
  Spinner,
  Text,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { FiCheck, FiChevronDown, FiRotateCcw, FiShuffle } from "react-icons/fi";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface NowPlayingProps {
  onGameChange: () => void;
}

function NowPlaying({ onGameChange }: NowPlayingProps) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [imgUrl, setImgUrl] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmFinishOpen, setConfirmFinishOpen] = useState(false);
  const [confirmSwapOpen, setConfirmSwapOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [igdbId, setIgdbId] = useState<number>(0);

  const fetchCurrentGame = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}games/current`,
      );

      const newTitle = response.data.title || "";
      const newSummary = response.data.synopsis || "";
      const newIgdbId = response.data.igdbId || 0;

      setTitle(newTitle);
      setSummary(newSummary);
      setIgdbId(newIgdbId);

      setImageLoaded(false);
      setImgUrl("");

      const artworks = response.data.artworks;

      if (artworks && artworks.length > 0) {
        const artworkResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}artworks?id=${artworks[0]}`,
        );
        const rawUrl = artworkResponse.data?.[0]?.url;

        if (!rawUrl) {
          setImageLoaded(false);
          setIsLoading(false);
          return;
        }

        const finalUrl = `https:${rawUrl.replace("t_thumb", "t_1080p")}`;
        setImgUrl(finalUrl);

        if (typeof window === "undefined") return;

        const img = new window.Image();
        img.onload = () => {
          setImageLoaded(true);
          setIsLoading(false);
        };
        img.onerror = () => {
          setImageLoaded(false);
          setIsLoading(false);
        };
        img.src = finalUrl;
      } else {
        setImageLoaded(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching games: ", error);
      setTitle("");
      setSummary("");
      setIgdbId(0);
      setImageLoaded(false);
      setIsLoading(false);
    }
  }, []);

  const finishGame = async (igdbId: number) => {
    setActionLoading(true);
    try {
      const { data } = await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_URL}games/${igdbId}`,
      );
      console.log("Juego finalizado:", data);
      fetchCurrentGame();
      onGameChange(); // Notifica al componente Next para que se actualice
      setActionMessage({ tone: "success", text: "Game marked as finished." });
    } catch (error) {
      console.error("Error de red o inesperado:", error);
      setActionMessage({ tone: "error", text: "Could not finish this game." });
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  const undoFinish = async () => {
    setActionLoading(true);
    try {
      const { data } = await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_URL}games/undo-finish`,
      );
      console.log("Juego revertido:", data);
      fetchCurrentGame();
      onGameChange(); // Notifica al componente Next para que se actualice
      setActionMessage({ tone: "success", text: "Finished action undone." });
    } catch (error) {
      console.error("Error revirtiendo juego:", error);
      setActionMessage({
        tone: "error",
        text: "Could not restore the previous game.",
      });
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  const swapCurrentGame = async () => {
    setActionLoading(true);
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}games/revert`);
      await fetchCurrentGame();
      onGameChange();
      setActionMessage({
        tone: "success",
        text: "Current game swapped with the next game.",
      });
    } catch (error) {
      console.error("Error swapping current game:", error);
      setActionMessage({
        tone: "error",
        text: "Could not swap games. Make sure the queue is not empty.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentGame();
  }, [fetchCurrentGame]);

  return (
    <Flex flexDirection="column" w="full" maxW="700px">
      <Flex
        justifyContent="space-between"
        alignItems="baseline"
        w="full"
        px={1}
      >
        <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="bold">
          Now Playing
        </Text>
        {title && (
          <Text color="whiteAlpha.600" fontSize="xs" textTransform="uppercase">
            In progress
          </Text>
        )}
      </Flex>

      <Box
        position="relative"
        width="full"
        height={expanded ? "auto" : { base: "360px", md: "500px" }}
        minHeight={{ base: "360px", md: "500px" }}
        mt={4}
        border="1px solid"
        borderColor="whiteAlpha.400"
        borderRadius="md"
        overflow="hidden"
        bg="whiteAlpha.100"
        transition="height 0.5s ease-in-out, border-color 0.2s"
      >
        {isLoading && (
          <Flex
            alignItems={"center"}
            justifyContent={"center"}
            w={"full"}
            h="full"
          >
            <Spinner size="xl" />
          </Flex>
        )}

        {!isLoading && !title && (
          <Flex
            direction="column"
            alignItems="center"
            justifyContent="center"
            h="full"
            p={8}
            textAlign="center"
          >
            <Text fontSize="2xl" fontWeight="bold">
              No game in progress
            </Text>
            <Text color="whiteAlpha.600" mt={2}>
              Choose the next game from the queue.
            </Text>
          </Flex>
        )}

        {!isLoading && imageLoaded && (
          <Image
            src={imgUrl}
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            objectFit="cover"
            zIndex="0"
            opacity="0.72"
            alt={title}
          />
        )}

        {title && (
          <Box
            position="absolute"
            inset="0"
            background="linear-gradient(to bottom, rgba(0,0,0,0.05) 20%, rgba(0,0,0,0.88) 100%)"
            zIndex="1"
          />
        )}

        {title && (
          <Flex
            flexDirection="column"
            position="relative"
            zIndex="2"
            width="full"
            minH="full"
            p={{ base: 5, md: 7 }}
            pb={{ base: 12, md: 14 }}
            color="white"
            cursor="pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <Text
              fontSize={{ base: "3xl", md: "5xl" }}
              fontWeight="bold"
              lineHeight="1.05"
              maxW="90%"
            >
              {title}
            </Text>

            <Text
              fontSize={{ base: "md", md: "lg" }}
              mt={4}
              opacity={expanded ? 1 : 0}
              maxHeight={expanded ? "1000px" : "0"}
              transition="all 0.5s ease-in-out"
              overflow="hidden"
              maxW="680px"
            >
              {summary || "No description available."}
            </Text>
          </Flex>
        )}

        {title && (
          <Flex
            position="absolute"
            bottom={{ base: 5, md: 7 }}
            left={{ base: 5, md: 7 }}
            alignItems="center"
            gap={2}
            color="whiteAlpha.700"
            fontSize="sm"
            zIndex="3"
            cursor="pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <Text>{expanded ? "Hide description" : "Read description"}</Text>
            <Box
              transform={expanded ? "rotate(180deg)" : "none"}
              transition="transform 0.3s"
            >
              <FiChevronDown />
            </Box>
          </Flex>
        )}
      </Box>
      <Flex justifyContent="center" alignItems="center" gap={2} mt={3}>
        <Flex flex={1}>
          <DialogRoot
            open={confirmFinishOpen}
            onOpenChange={(details) => setConfirmFinishOpen(details.open)}
          >
            <DialogTrigger asChild>
              <Button
                variant="solid"
                w="full"
                loading={actionLoading}
                disabled={!igdbId}
              >
                <FiCheck />
                Finished
              </Button>
            </DialogTrigger>
            <DialogContent bg="gray.800" color="white" maxW="420px" p={6}>
              <DialogHeader>
                <DialogTitle>Finish this game?</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <Text color="whiteAlpha.700" mb={5}>
                  This will move {title} to Played and start the next game in
                  the queue.
                </Text>
                <Flex gap={2} justifyContent="flex-end">
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmFinishOpen(false)}
                    p={2}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorPalette="green"
                    loading={actionLoading}
                    onClick={() => {
                      setConfirmFinishOpen(false);
                      finishGame(igdbId);
                    }}
                    p={2}
                  >
                    Finish game
                  </Button>
                </Flex>
              </DialogBody>
              <DialogCloseTrigger />
            </DialogContent>
          </DialogRoot>
        </Flex>
        <IconButton
          aria-label="Undo last finished game"
          variant="outline"
          loading={actionLoading}
          disabled={!igdbId}
          onClick={undoFinish}
        >
          <FiRotateCcw />
        </IconButton>
        <DialogRoot
          open={confirmSwapOpen}
          onOpenChange={(details) => setConfirmSwapOpen(details.open)}
        >
          <DialogTrigger asChild>
            <IconButton
              aria-label="Swap current game with next game"
              variant="outline"
              loading={actionLoading}
              disabled={!igdbId}
            >
              <FiShuffle />
            </IconButton>
          </DialogTrigger>
          <DialogContent bg="gray.800" color="white" maxW="420px" p={6}>
            <DialogHeader>
              <DialogTitle>Play the next game?</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text color="whiteAlpha.700" mb={5}>
                {title} will move to the front of the queue and the next game
                will become Now Playing.
              </Text>
              <Flex gap={2} justifyContent="flex-end">
                <Button
                  variant="ghost"
                  onClick={() => setConfirmSwapOpen(false)}
                  p={4}
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="yellow"
                  loading={actionLoading}
                  onClick={() => {
                    setConfirmSwapOpen(false);
                    swapCurrentGame();
                  }}
                  p={4}
                >
                  Switch games
                </Button>
              </Flex>
            </DialogBody>
            <DialogCloseTrigger />
          </DialogContent>
        </DialogRoot>
      </Flex>
      <Text
        minH="20px"
        mt={2}
        fontSize="xs"
        textAlign="center"
        color={actionMessage?.tone === "error" ? "red.300" : "green.300"}
      >
        {actionMessage?.text}
      </Text>
    </Flex>
  );
}

export default NowPlaying;
