import { Flex, Text } from "@chakra-ui/react";
import React from "react";
import games from "../db/backlog.js";
import Card from "./Card";

function Next() {
  return (
    <Flex flexDirection={"column"}>
      <Text fontSize={"4xl"} fontWeight={"bold"} mb={4}>
        Play next:
      </Text>
      {games.slice(1).map((item, index) => {
        return (
          <Flex key={index}>
            <Card title={item.name} />
          </Flex>
        );
      })}
    </Flex>
  );
}

export default Next;
