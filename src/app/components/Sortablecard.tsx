import { Flex } from "@chakra-ui/react";
import { useSortable } from "@dnd-kit/sortable";
import React from "react";
import Card from "./Card";
import { CSS } from "@dnd-kit/utilities";

interface Game {
  id: string;
  title: string;
  summary: string;
  artworks: string[];
  order: number;
}

function Sortablecard({ game }: { game: Game }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: game.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Flex ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card title={game.title} />
    </Flex>
  );
}

export default Sortablecard;
