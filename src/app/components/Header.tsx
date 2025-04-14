import { Flex } from "@chakra-ui/react";
import React from "react";

import GlitchText from "./ASCIIText";

function Header() {
  return (
    <Flex
      justifyContent={"center"}
      alignItems={"center"}
      height={100}
      w={500}
      my={10}
    >
      <GlitchText
        speed={1}
        enableShadows={true}
        enableOnHover={true}
        className="custom-class"
      >
        Backlofi
      </GlitchText>
    </Flex>
  );
}

export default Header;
