import React from 'react';
import { View, TextInput, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

export const SearchFilterBar = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search...',
  filterOptions = [],
  selectedFilter,
  onFilterChange,
}) => {
  const { theme } = useAuth();

  return (
    <View style={styles.container}>
      {/* Search Input Box */}
      <View
        style={[
          styles.searchBox,
          { backgroundColor: theme.inputBackground, borderColor: theme.border },
        ]}
      >
        <Ionicons name="search" size={18} color={theme.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textSubtle}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Chips */}
      {filterOptions && filterOptions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {filterOptions.map((opt) => {
            const isSelected = selectedFilter === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.inputBackground,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => onFilterChange(opt)}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textMuted,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  chipsScroll: {
    paddingTop: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 6,
  },
  chipText: {
    fontSize: 12,
  },
});

export default SearchFilterBar;
