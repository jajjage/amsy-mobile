import { useTheme } from "@/context/ThemeContext";
import { DashboardAnnouncement } from "@/types/announcement.types";
import { Megaphone, X } from "lucide-react-native";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface DashboardAnnouncementModalProps {
  announcement: DashboardAnnouncement | null;
  visible: boolean;
  onDismiss: () => void;
}

export function DashboardAnnouncementModal({
  announcement,
  visible,
  onDismiss,
}: DashboardAnnouncementModalProps) {
  const { colors, isDark } = useTheme();

  if (!announcement) return null;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: isDark ? colors.card : "#FFFFFF" }]}>
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}14` }]}>
              <Megaphone color={colors.primary} size={24} strokeWidth={2.2} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>{announcement.title}</Text>
            <Pressable
              accessibilityLabel="Dismiss announcement"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onDismiss}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            >
              <X color={colors.mutedForeground || "#888888"} size={22} strokeWidth={2.4} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.messageContent}
            showsVerticalScrollIndicator={false}
            style={styles.messageScroll}
          >
            <Text style={[styles.message, { color: colors.foreground }]}>{announcement.message}</Text>
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            onPress={onDismiss}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.primary },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(8, 23, 47, 0.58)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 24,
    elevation: 16,
    maxHeight: "72%",
    maxWidth: 420,
    padding: 24,
    shadowColor: "#08172F",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    width: "100%",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  closeButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  messageScroll: {
    maxHeight: 280,
  },
  messageContent: {
    paddingBottom: 8,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    alignItems: "center",
    alignSelf: "flex-end",
    borderRadius: 14,
    justifyContent: "center",
    marginTop: 24,
    minHeight: 52,
    minWidth: 88,
    paddingHorizontal: 22,
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
