"use client";

import { Box, Flex, Image, Spinner, Text } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { FiCheck } from "react-icons/fi";

interface FinishedGame {
  id: number;
  igdbId: number;
  title: string;
  synopsis?: string;
  artworks: number[];
  playStatus: "PLAYING" | "BACKLOG" | "COMPLETED";
  releaseYear?: number;
  updatedAt?: string;
}

function FinishedCard({ game }: { game: FinishedGame }) {
  const [expanded, setExpanded] = useState(false);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const artworkId = game.artworks?.[0];

    if (!artworkId) return undefined;

    axios
      .get(`${process.env.NEXT_PUBLIC_BASE_URL}artworks?id=${artworkId}`)
      .then((response) => {
        const rawUrl = response.data?.[0]?.url;
        if (!cancelled && rawUrl) {
          setArtworkUrl(`https:${rawUrl.replace("t_thumb", "t_1080p")}`);
        }
      })
      .catch(() => {
        if (!cancelled) setArtworkUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [game.artworks]);

  return (
    <Flex
      as="button"
      onClick={() => setExpanded((value) => !value)}
      position="relative"
      alignItems="stretch"
      textAlign="left"
      overflow="hidden"
      minH="132px"
      w="full"
      border="1px solid"
      borderColor="whiteAlpha.300"
      borderRadius="md"
      bg="whiteAlpha.100"
      cursor="pointer"
      transition="background 0.2s, border-color 0.2s"
      _hover={{ bg: "whiteAlpha.200", borderColor: "whiteAlpha.500" }}
    >
      {artworkUrl && (
        <>
          <Image
            src={artworkUrl}
            alt=""
            aria-hidden="true"
            position="absolute"
            right="0"
            top="0"
            w="42%"
            h="full"
            objectFit="cover"
            opacity={0.48}
            css={{
              maskImage:
                "linear-gradient(to right, transparent 0%, black 55%, black 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 55%, black 100%)",
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bgGradient="to-r"
            gradientFrom="blackAlpha.900"
            gradientVia="blackAlpha.800"
            gradientTo="blackAlpha.200"
          />
        </>
      )}

      <Flex position="relative" zIndex={1} direction="column" p={4} w="full">
        <Flex alignItems="center" gap={3} mb={1} justifyContent="space-between">
          <Text
            fontSize="lg"
            fontWeight="bold"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {game.title}
          </Text>
          <Flex alignItems="center" gap={2} mb={2}>
            <FiCheck color="#8fd694" />
            <Text
              color="green.200"
              fontSize="xs"
              fontWeight="bold"
              textTransform="uppercase"
            >
              Finished
            </Text>
          </Flex>
        </Flex>
        <Text
          mt={3}
          color="whiteAlpha.800"
          fontSize="sm"
          overflow={expanded ? "visible" : "hidden"}
          display={expanded ? "block" : "-webkit-box"}
          css={
            expanded
              ? undefined
              : { WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }
          }
        >
          {game.synopsis || "Sin descripción disponible."}
        </Text>
        {!expanded && game.synopsis && (
          <Text mt="auto" pt={2} color="whiteAlpha.500" fontSize="xs">
            Click to expand
          </Text>
        )}
      </Flex>
    </Flex>
  );
}

export default function FinishedGames({
  refreshTrigger = 0,
}: {
  refreshTrigger?: number;
}) {
  const [games, setGames] = useState<FinishedGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    axios
      .get(`${process.env.NEXT_PUBLIC_BASE_URL}games/all`)
      .then((response) => {
        if (!cancelled) {
          setGames(
            response.data
              .filter((game: FinishedGame) => game.playStatus === "COMPLETED")
              .sort(
                (a: FinishedGame, b: FinishedGame) =>
                  new Date(b.updatedAt || 0).getTime() -
                  new Date(a.updatedAt || 0).getTime(),
              ),
          );
        }
      })
      .catch((error) =>
        console.error("Error al obtener juegos terminados:", error),
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  return (
    <Flex direction="column" w="full" maxW="700px" mt={10}>
      <Flex alignItems="center" gap={3} mb={4}>
        <Text fontSize="3xl" fontWeight="bold">
          Played
        </Text>
        <Text color="whiteAlpha.600" fontSize="sm">
          {games.length} finished games
        </Text>
      </Flex>

      {loading && <Spinner alignSelf="center" />}
      {!loading && games.length === 0 && (
        <Text color="whiteAlpha.600" py={6} textAlign="center">
          Still no finished games.
        </Text>
      )}
      {!loading && games.length > 0 && (
        <Flex direction="column" gap={2}>
          {games.map((game) => (
            <FinishedCard key={game.id} game={game} />
          ))}
        </Flex>
      )}
    </Flex>
  );
}
