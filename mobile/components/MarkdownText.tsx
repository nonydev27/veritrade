import React from 'react';
import { Text, StyleSheet, StyleProp, TextStyle } from 'react-native';

type Props = {
  text: string;
  style?: StyleProp<TextStyle>;
  boldStyle?: StyleProp<TextStyle>;
};

/** Lightweight markdown: **bold**, bullet lines, newlines */
export function MarkdownText({ text, style, boldStyle }: Props) {
  const lines = text.split('\n');

  return (
    <Text style={style}>
      {lines.map((line, lineIdx) => {
        const isBullet = /^[•\-\*]\s/.test(line);
        const content = isBullet ? line.replace(/^[•\-\*]\s/, '') : line;
        const parts = content.split(/(\*\*[^*]+\*\*)/g);

        return (
          <Text key={lineIdx}>
            {isBullet ? '  • ' : ''}
            {parts.map((part, i) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <Text key={i} style={[styles.bold, boldStyle]}>
                  {part.slice(2, -2)}
                </Text>
              ) : (
                <Text key={i}>{part}</Text>
              )
            )}
            {lineIdx < lines.length - 1 ? '\n' : ''}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
});
