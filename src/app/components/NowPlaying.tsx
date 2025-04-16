"use client";
import { Box, Button, Flex, Image, Spinner, Text } from "@chakra-ui/react";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";

function NowPlaying() {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [imgUrl, setImgUrl] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [url, setUrl] = useState<string>("");
  const [igdbId, setIgdbId] = useState<number>(0);
  const [imgDimensions, setImgDimensions] = useState({
    width: 700,
    height: 500,
  });

  const fetchCurrentGame = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}games/current`
      );

      setTitle(response.data.title || "");
      setSummary(response.data.synopsis || "");
      setIgdbId(response.data.igdbId || 0);

      if (response.data.artworks || response.data.artworks.length > 0) {
        const artworkResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}artworks?id=${response.data.artworks[0]}`
        );

        console.log("AWKRSE", artworkResponse.data[0].url);
        const finalUrl = `https:${artworkResponse.data[0].url.replace("t_thumb", "t_original")}`;
        setUrl(finalUrl);

        if (!url || typeof window === "undefined") return;

        const img = new window.Image();
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
        img.src = finalUrl;

        setImgUrl(finalUrl || "");
      }
    } catch (error) {
      console.error("Error fetching games: ", error);
    }
  }, [title]);

  const finishGame = async (igdbId: number) => {
    try {
      const { data } = await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_URL}games/${igdbId}`
      );
      console.log("Juego finalizado:", data);
      fetchCurrentGame();
    } catch (error) {
      console.error("Error de red o inesperado:", error);
      return null;
    }
  };

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
      <Flex justifyContent={"center"} alignItems={"center"}>
        <Button
          backgroundColor={"transparent"}
          color={"white"}
          border={"2px solid white"}
          w={700}
          _hover={{
            backgroundColor: "gray",
          }}
          _active={{
            backgroundColor: "transparent",
            transform: "scale(0.95)",
          }}
          onClick={() => finishGame(igdbId)}
        >
          Finished
        </Button>
      </Flex>
    </Flex>
  );
}

export default NowPlaying;
