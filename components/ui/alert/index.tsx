import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  /** The variant/type of alert */
  variant?: AlertVariant;
  /** Title of the alert */
  title?: string;
  /** Message/description of the alert */
  message: string;
  /** Whether to show close button */
  closable?: boolean;
  /** Callback when close is pressed */
  onClose?: () => void;
  /** Additional className for styling */
  className?: string;
}

const VARIANTS = {
  success: {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    icon: 'checkmark-circle' as const,
    iconColor: '#16A34A',
    titleColor: '#166534',
    textColor: '#15803d',
  },
  error: {
    bg: '#fef2f2',
    border: '#fecaca',
    icon: 'alert-circle' as const,
    iconColor: '#DC2626',
    titleColor: '#991b1b',
    textColor: '#b91c1c',
  },
  warning: {
    bg: '#fffbeb',
    border: '#fde68a',
    icon: 'warning' as const,
    iconColor: '#D97706',
    titleColor: '#92400e',
    textColor: '#b45309',
  },
  info: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: 'information-circle' as const,
    iconColor: '#2563EB',
    titleColor: '#1e40af',
    textColor: '#1d4ed8',
  },
};

export function Alert({
  variant = 'info',
  title,
  message,
  closable = false,
  onClose,
  className = '',
}: AlertProps) {
  const config = VARIANTS[variant];

  return (
    <View
      className="border rounded-xl p-3"
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
      ]}
    >
      <HStack space="sm" className="items-start">
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name={config.icon} size={20} color={config.iconColor} />
        </View>

        {/* Content */}
        <VStack space="xs" className="flex-1">
          {title && (
            <Text className="font-semibold text-sm" style={{ color: config.titleColor }}>
              {title}
            </Text>
          )}
          <Text className="text-sm" style={{ color: config.textColor }}>
            {message}
          </Text>
        </VStack>

        {/* Close button */}
        {closable && onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={18} color={config.iconColor} />
          </TouchableOpacity>
        )}
      </HStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    marginTop: 1,
  },
  closeButton: {
    padding: 2,
    marginLeft: 8,
  },
});

export default Alert;
