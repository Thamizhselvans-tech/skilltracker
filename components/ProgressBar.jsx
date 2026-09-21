import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';

export const ProgressBar = ({ progress = 0, color, height = 8, style }) => {
  const { theme } = useAuth();
  const clampedProgress = Math.min(100, Math.max(0, Number(progress) || 0));

  return (
    <View style={[styles.container, { backgroundColor: theme.inputBackground, height }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            backgroundColor: color || theme.primary,
            height,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 6,
  },
});

export default ProgressBar;
