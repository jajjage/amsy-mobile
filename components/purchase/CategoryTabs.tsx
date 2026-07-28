/**
 * CategoryTabs - Multi-row wrapped category filter tabs
 * Displays top categories at top and wraps additional categories below
 */

import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { ProductCategory } from "@/types/product.types";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

interface CategoryTabsProps {
  categories: ProductCategory[];
  selectedCategory: string;
  onSelect: (categorySlug: string) => void;
  isLoading?: boolean;
}

export function CategoryTabs({
  categories,
  selectedCategory,
  onSelect,
  isLoading = false,
}: CategoryTabsProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  // Sort categories by priority (if exists)
  const sortedCategories = [...categories].sort(
    (a, b) => (a.priority || 0) - (b.priority || 0)
  );

  // Map categories from DB only
  const allTabs = sortedCategories.map((cat) => ({
    slug: cat.slug,
    name: cat.name,
    id: cat.id,
  }));

  const handleSelect = (slug: string) => {
    Haptics.selectionAsync();
    onSelect(slug);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.gridContent}>
        {allTabs.map((tab) => {
          const isActive = selectedCategory === tab.slug;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive ? colors.primary : "transparent",
                  borderColor: isActive ? colors.primary : colors.border,
                },
                isActive && styles.activeTab,
              ]}
              onPress={() => handleSelect(tab.slug)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive
                      ? colors.primaryForeground
                      : colors.textSecondary,
                  },
                  isActive && styles.activeTabText,
                ]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.md,
  },
  loadingContainer: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  gridContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: designTokens.spacing.sm,
  },
  tab: {
    paddingVertical: designTokens.spacing.sm,
    paddingHorizontal: designTokens.spacing.md,
    borderRadius: designTokens.radius.full,
    borderWidth: 1,
  },
  activeTab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "500",
  },
  activeTabText: {
    fontWeight: "600",
  },
});
