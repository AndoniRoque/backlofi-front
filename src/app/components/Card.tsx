import { Flex, Text } from "@chakra-ui/react";
import React from "react";

interface CardProps {
  title: string;
}

export default function Card({ title }: CardProps) {
  return (
    <Flex border={"2px solid gray"} p={4} m={4} w={500} h={"auto"}>
      <Text>{title}</Text>
    </Flex>
  );
}
