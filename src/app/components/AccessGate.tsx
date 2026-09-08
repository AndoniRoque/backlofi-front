"use client";

import { Box, Button, Flex, Input, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FiLock, FiUnlock } from "react-icons/fi";

const ACCESS_CODE = "0451";

export default function AccessGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submitCode = () => {
    if (code === ACCESS_CODE) {
      setUnlocked(true);
      return;
    }

    setCode("");
    setHasError(true);
    inputRef.current?.focus();
  };

  if (unlocked) return <>{children}</>;

  return (
    <Flex
      position="fixed"
      inset="0"
      zIndex={9999}
      alignItems="center"
      justifyContent="center"
      bg="#08090b"
      px={6}
    >
      <Box
        as="main"
        w="full"
        maxW="420px"
        border="1px solid"
        borderColor="whiteAlpha.300"
        borderRadius="md"
        bg="whiteAlpha.100"
        p={{ base: 6, md: 8 }}
        boxShadow="0 24px 80px rgba(0, 0, 0, 0.45)"
      >
        <Flex direction="column" alignItems="center" textAlign="center">
          <Flex
            alignItems="center"
            justifyContent="center"
            w="52px"
            h="52px"
            mb={5}
            border="1px solid"
            borderColor="yellow.500"
            borderRadius="full"
            color="yellow.300"
          >
            {hasError ? <FiUnlock size={22} /> : <FiLock size={22} />}
          </Flex>
          <Text fontSize="2xl" fontWeight="bold">
            Private session
          </Text>
          <Text mt={2} color="whiteAlpha.600" fontSize="sm">
            Enter the four-digit code to join the backlog.
          </Text>

          <Input
            ref={inputRef}
            mt={6}
            value={code}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            autoComplete="off"
            aria-label="Four digit access code"
            textAlign="center"
            letterSpacing="0.35em"
            fontSize="2xl"
            fontWeight="bold"
            color={hasError ? "red.300" : "white"}
            borderColor={hasError ? "red.400" : "whiteAlpha.400"}
            onChange={(event) => {
              setHasError(false);
              setCode(event.target.value.replace(/\D/g, "").slice(0, 4));
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && code.length === 4) submitCode();
            }}
          />
          <Button
            mt={4}
            w="full"
            colorPalette="yellow"
            disabled={code.length !== 4}
            onClick={submitCode}
          >
            Enter
          </Button>
          <Text
            minH="20px"
            mt={3}
            color="red.300"
            fontSize="xs"
            aria-live="polite"
          >
            {hasError ? "That code did not work. Try again." : ""}
          </Text>
        </Flex>
      </Box>
    </Flex>
  );
}
