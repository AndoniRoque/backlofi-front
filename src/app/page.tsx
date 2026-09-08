"use client";
import Header from "./components/Header";
import { Flex } from "@chakra-ui/react";
import { useState } from "react";
import NowPlaying from "./components/NowPlaying";
import Next from "./components/Next";
import FinishedGames from "./components/FinishedGames";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Flex
      flexDirection={"column"}
      justifyContent={"center"}
      alignItems={"center"}
    >
      <Header />
      <Flex
        justifyContent="space-around"
        alignItems="flex-start"
        flexDirection={{ base: "column", lg: "row" }}
        gap={{ base: 10, lg: 8 }}
        w="full"
        px={{ base: 4, lg: 8 }}
      >
        <Flex direction="column" w="full" alignItems="center">
          <NowPlaying onGameChange={triggerRefresh} />
          <FinishedGames refreshTrigger={refreshTrigger} />
        </Flex>
        <Next refreshTrigger={refreshTrigger} />
      </Flex>
    </Flex>
  );
}
