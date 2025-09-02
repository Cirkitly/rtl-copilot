/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Newline, Text } from 'ink';
import { theme as semanticTheme } from '../semantic-colors.js';
import { useKeypress } from '../hooks/useKeypress.js';

interface GeminiPrivacyNoticeProps {
  onExit: () => void;
}

export const GeminiPrivacyNotice = ({ onExit }: GeminiPrivacyNoticeProps) => {
  useKeypress(
    (key) => {
      if (key.name === 'escape') {
        onExit();
      }
    },
    { isActive: true },
  );

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color={semanticTheme.text.accent}>
        Gemini API Key Notice
      </Text>
      <Newline />
      <Text>
        By using the Gemini API<Text color={semanticTheme.text.link}>[1]</Text>,
        Google AI Studio
        <Text color={semanticTheme.status.error}>[2]</Text>, and the other
        Google developer services that reference these terms (collectively, the
        &quot;APIs&quot; or &quot;Services&quot;), you are agreeing to Google
        APIs Terms of Service (the &quot;API Terms&quot;)
        <Text color={semanticTheme.status.success}>[3]</Text>, and the Gemini
        API Additional Terms of Service (the &quot;Additional Terms&quot;)
        <Text color={semanticTheme.text.accent}>[4]</Text>.
      </Text>
      <Newline />
      <Text>
        <Text color={semanticTheme.text.link}>[1]</Text>{' '}
        https://ai.google.dev/docs/gemini_api_overview
      </Text>
      <Text>
        <Text color={semanticTheme.status.error}>[2]</Text>{' '}
        https://aistudio.google.com/
      </Text>
      <Text>
        <Text color={semanticTheme.status.success}>[3]</Text>{' '}
        https://developers.google.com/terms
      </Text>
      <Text>
        <Text color={semanticTheme.text.accent}>[4]</Text>{' '}
        https://ai.google.dev/gemini-api/terms
      </Text>
      <Newline />
      <Text color={semanticTheme.text.secondary}>Press Esc to exit.</Text>
    </Box>
  );
};
