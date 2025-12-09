"use client";
import Header from "./components/Header";
import { Flex } from "@chakra-ui/react";
import { useState } from "react";
import NowPlaying from "./components/NowPlaying";
import Next from "./components/Next";

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
      <Flex justifyContent={"space-around"} flexDirection={"row"} w={"full"}>
        <NowPlaying onGameChange={triggerRefresh} />
        <Next refreshTrigger={refreshTrigger} />
      </Flex>
    </Flex>
  );
}
