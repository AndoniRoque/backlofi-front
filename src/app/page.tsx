import Header from "./components/Header";
import NowPlaying from "./components/NowPlaying";
import Next from "./components/Next";
import { Flex } from "@chakra-ui/react";

export default function Home() {
  return (
    <Flex
      flexDirection={"column"}
      justifyContent={"center"}
      alignItems={"center"}
    >
      <Header />
      <Flex justifyContent={"space-around"} flexDirection={"row"} w={"full"}>
        <NowPlaying />
        <Next />
      </Flex>
    </Flex>
  );
}
