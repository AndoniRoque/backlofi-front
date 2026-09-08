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
import { FiCheck, FiChevronDown, FiRotateCcw } from "react-icons/fi";

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
  const [igdbId, setIgdbId] = useState<number>(0);
  const [imgDimensions, setImgDimensions] = useState({
    width: 700,
    height: 500,
  });

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

      // reset de imagen
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
          const maxWidth = 700;
          const aspectRatio = img.width / img.height;
          const newWidth = Math.min(img.width, maxWidth);
          const newHeight = newWidth / aspectRatio;

          setImgDimensions({ width: newWidth, height: newHeight });
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
    } catch (error) {
      console.error("Error de red o inesperado:", error);
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  const revertGame = async () => {
    setActionLoading(true);
    try {
      const { data } = await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_URL}games/revert`,
      );
      console.log("Juego revertido:", data);
      fetchCurrentGame();
      onGameChange(); // Notifica al componente Next para que se actualice
    } catch (error) {
      console.error("Error revirtiendo juego:", error);
      return null;
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
          <Button
            variant="solid"
            w="full"
            loading={actionLoading}
            disabled={!igdbId}
            onClick={() => finishGame(igdbId)}
          >
            <FiCheck />
            Finished
          </Button>
        </Flex>
        <Flex>
          <IconButton
            aria-label="Revert to previous game"
            loading={actionLoading}
            disabled={!igdbId}
            onClick={revertGame}
          >
            <FiRotateCcw />
          </IconButton>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default NowPlaying;
