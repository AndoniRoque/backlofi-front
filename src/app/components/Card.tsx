import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { FiMenu, FiTrash2 } from "react-icons/fi";
import React from "react";

interface CardProps {
  title: string;
  position?: number;
  onRemove?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export default function Card({
  title,
  position,
  onRemove,
  dragHandleProps,
}: CardProps) {
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
      transition="background 0.2s, border-color 0.2s"
      _hover={{ bg: "whiteAlpha.200", borderColor: "whiteAlpha.500" }}
    >
      <Text
        color="whiteAlpha.600"
        fontSize="sm"
        fontWeight="bold"
        minW="24px"
        textAlign="center"
      >
        {String(position ?? 0).padStart(2, "0")}
      </Text>

      <Box flex="1" minW={0}>
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
