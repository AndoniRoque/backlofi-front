import { Box, Flex, IconButton, Image, Text } from "@chakra-ui/react";
import { FiMenu, FiTrash2 } from "react-icons/fi";
import axios from "axios";
import React, { useEffect, useState } from "react";

interface CardProps {
  title: string;
  artworkId?: number;
  position?: number;
  onRemove?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export default function Card({
  title,
  artworkId,
  position,
  onRemove,
  dragHandleProps,
}: CardProps) {
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!artworkId) {
      setArtworkUrl(null);
      return () => {
        cancelled = true;
      };
    }

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
  }, [artworkId]);

  return (
    <Flex
      alignItems="center"
      gap={3}
      border="1px solid"
      borderColor="whiteAlpha.300"
      borderRadius="md"
      bg="whiteAlpha.100"
      px={{ base: 3, md: 4 }}
      py={3}
      w="full"
      minH="76px"
      position="relative"
      overflow="hidden"
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
            w="58%"
            h="full"
            objectFit="cover"
            opacity={0.72}
            zIndex={0}
          />
          <Box
            position="absolute"
            inset="0"
            bgGradient="to-r"
            gradientFrom="blackAlpha.900"
            gradientVia="blackAlpha.700"
            gradientTo="blackAlpha.100"
            zIndex={1}
          />
        </>
      )}

      <Text
        position="relative"
        zIndex={2}
        color="whiteAlpha.600"
        fontSize="sm"
        fontWeight="bold"
        minW="24px"
        textAlign="center"
      >
        {String(position ?? 0).padStart(2, "0")}
      </Text>

      <Box position="relative" zIndex={2} flex="1" minW={0}>
        <Text
          fontWeight="bold"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {title}
        </Text>
        <Text color="whiteAlpha.600" fontSize="xs" mt={1}>
          En cola
        </Text>
      </Box>

      <IconButton
        position="relative"
        zIndex={2}
        {...dragHandleProps}
        aria-label={`Reordenar ${title}`}
        variant="ghost"
        color="whiteAlpha.600"
        size="sm"
        cursor="grab"
        _active={{ cursor: "grabbing" }}
      >
        <FiMenu />
      </IconButton>

      {onRemove && (
        <IconButton
          position="relative"
          zIndex={2}
          aria-label={`Quitar ${title} de la cola`}
          variant="ghost"
          color="whiteAlpha.600"
          size="sm"
          onClick={onRemove}
          _hover={{ color: "red.300", bg: "red.900" }}
        >
          <FiTrash2 />
        </IconButton>
      )}
    </Flex>
  );
}
