"use client";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
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

  const fetchCurrentGame = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3002/search?name=${title}`
      );
      const match = response.data.find(
        (game: { name: string }) =>
          game.name.toLowerCase() === title.toLowerCase()
      );
      console.log(match);
      setSummary(match.summary || "");
      const artwork_id = await axios.get(
        `http://localhost:3002/artworks?id=${match.artworks[0]}`
      );
      const url = artwork_id.data[0].url.replace("t_thumb", "t_original");
      setImgUrl(url);

      // Preload the image to get its dimensions
      const img = new Image();
      img.onload = () => {
        // Limit max width to 700px but maintain aspect ratio
        const maxWidth = 700;
        const aspectRatio = img.width / img.height;
        let newWidth = Math.min(img.width, maxWidth);
        let newHeight = newWidth / aspectRatio;

        setImgDimensions({ width: newWidth, height: newHeight });
        setImageLoaded(true);
      };
      img.src = `https:${url}`;
    } catch (error) {
      console.error("Error fetching games: ", error);
      return [];
    }
  };

  useEffect(() => {
    fetchCurrentGame();
  }, []);

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
        {/* Background image */}
        <Image
          src={imgUrl ? `https:${imgUrl}` : "/file.svg"}
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
