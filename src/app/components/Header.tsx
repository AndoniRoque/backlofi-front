import { Flex } from "@chakra-ui/react";
import React from "react";
import ASCIIText from "./ASCIIText";

function Header() {
  return (
    <Flex
      justifyContent={"center"}
      alignItems={"center"}
      height={100}
      w={500}
      my={10}
    >
      <ASCIIText
        text="Backlofi"
        enableWaves={true}
        asciiFontSize={4}
        textFontSize={10}
      />
    </Flex>
  );
}

export default Header;
