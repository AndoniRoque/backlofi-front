"use client";
import { Box, Flex, Image, Spinner, Text } from "@chakra-ui/react";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import games from "../db/backlog";

function NowPlaying() {
  const [expanded, setExpanded] = useState<boolean>(false);
  const title = games[0].name;
  const [imgUrl, setImgUrl] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imgDimensions, setImgDimensions] = useState({
    width: 700,
    height: 500,
  });

  const fetchCurrentGame = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}search?name=${title}`
      );

      const match = response.data.find(
        (game: { name: string }) =>
          game.name.toLowerCase() === title.toLowerCase()
      );

      if (!match) throw new Error("Game not found");

      setSummary(match.summary || "");

      if (!match.artworks || match.artworks.length === 0)
        throw new Error("No artworks found");

      const artworkResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}artworks?id=${match.artworks[0]}`
      );

      if (!artworkResponse.data || artworkResponse.data.length === 0) {
        throw new Error("Artwork not found");
      }

      const url = artworkResponse.data[0].url.replace("t_thumb", "t_original");

      const img = new Image();
      img.onload = () => {
        const maxWidth = 700;
        const aspectRatio = img.width / img.height;
        const newWidth = Math.min(img.width, maxWidth);
        const newHeight = newWidth / aspectRatio;

        setImgDimensions({ width: newWidth, height: newHeight });
        setImageLoaded(true);
      };
      img.onerror = () => {
        console.error("Failed to load image");
      };
      img.src = `https:${url}`;

      setImgUrl(`https:${url}`);
    } catch (error) {
      console.error("Error fetching games: ", error);
    }
  }, [title]); // Se asegura de que la función no cambie a menos que `title` cambie

  useEffect(() => {
    fetchCurrentGame();
  }, [fetchCurrentGame]); // Se incluye `fetchCurrentGame` como dependencia

  return (
    <Flex flexDirection={"column"}>
      <Flex justifyContent={"start"} alignItems={"start"} w={700}>
        <Text fontSize="4xl" fontWeight="bold" textAlign={"left"}>
          Now Playing...
        </Text>
      </Flex>

      {/* Background container */}
      <Box
        position="relative"
        width={`${imgDimensions.width}px`}
        height={expanded ? "auto" : `${imgDimensions.height}px`}
        minHeight={`${imgDimensions.height}px`}
        maxWidth="700px"
        m={4}
        border={"3px solid white"}
        borderRadius="md"
        overflow="hidden"
        transition="all 0.5s ease-in-out"
      >
        {/* Mostrar el Spinner mientras la imagen se carga */}
        {!imageLoaded && (
          <Flex
            alignItems={"center"}
            justifyContent={"center"}
            w={"full"}
            h={`${imgDimensions.height}px`}
          >
            <Spinner size="xl" />
          </Flex>
        )}

        {/* Mostrar la imagen solo cuando haya cargado */}
        {imageLoaded && (
          <Image
            src={imgUrl}
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            objectFit="cover"
            zIndex="0"
            opacity="0.8"
            alt={title}
          />
        )}

        {/* Gradient overlay */}
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          background="linear-gradient(to bottom, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.8) 100%)"
          zIndex="1"
        />

        {/* Content */}
        <Flex
          flexDirection="column"
          position="relative"
          zIndex="2"
          width={"full"}
          p={4}
          color="white"
          cursor="pointer"
          onClick={() => setExpanded(!expanded)}
          alignItems={"center"}
          h={"full"}
        >
          <Text fontSize="5xl" fontWeight="bold" textAlign="start" w={"full"}>
            {title}
          </Text>

          {/* Summary text */}
          <Text
            fontSize="lg"
            mt={2}
            opacity={expanded ? 1 : 0}
            maxHeight={expanded ? "1000px" : "0"}
            margin={expanded ? "16px 0" : "0"}
            padding={expanded ? "8px 0" : "0"}
            transition="all 0.6s ease-in-out"
            overflow="hidden"
            w={"full"}
          >
            {summary}
          </Text>

          {/* Click to expand text */}
          <Text
            fontSize="sm"
            mt="auto"
            opacity={expanded ? 0 : 0.7}
            maxHeight={expanded ? "0" : "20px"}
            transition="all 0.3s ease-in-out"
            overflow="hidden"
            textAlign="center"
          >
            Click to expand...
          </Text>
        </Flex>
      </Box>
    </Flex>
  );
}

export default NowPlaying;
