/**
 * BillSuccessReceipt Component
 * High-craft, copy-friendly and screenshot-ready receipt modal for Bills, Cable TV & Exam PINs.
 */

import { designTokens } from "@/constants/palette";
import { useTheme } from "@/context/ThemeContext";
import { BillCategoryType } from "@/types/bill-payment.types";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import {
  Check,
  CheckCircle2,
  Copy,
  GraduationCap,
  Share2,
  Tv,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ViewShot from "react-native-view-shot";

export interface BillSuccessReceiptData {
  transactionId?: string | null;
  categoryType: BillCategoryType;
  billerName: string;
  amount: number;
  customerIdentifier?: string;
  phone?: string;
  customerName?: string | null;
  variationName?: string | null;
  quantity?: number;
  tokenPayload?: any;
  rawToken?: string | null;
  timestamp?: Date;
}

interface BillSuccessReceiptProps {
  data: BillSuccessReceiptData;
  onDone: () => void;
}

export interface ParsedPinCard {
  id: string;
  serial?: string;
  pin: string;
}

export interface ParsedBillTokens {
  pins: ParsedPinCard[];
  electricityToken?: {
    raw: string;
    formatted: string;
    units?: string;
  };
  genericToken?: string;
  rawText?: string;
}

export function parseBillTokens(
  tokenPayload: any,
  rawToken?: string | null,
  categoryType?: BillCategoryType
): ParsedBillTokens {
  const result: ParsedBillTokens = {
    pins: [],
  };

  // 1. Check if tokenPayload has cards array
  if (Array.isArray(tokenPayload?.cards) && tokenPayload.cards.length > 0) {
    result.pins = tokenPayload.cards
      .map((c: any, index: number) => {
        const serial = String(
          c.Serial || c.serial || c.s_n || c.SN || ""
        ).trim();
        const pin = String(
          c.Pin || c.pin || c.PIN || c.token || c.Token || c.code || ""
        ).trim();
        return {
          id: `card-${index}`,
          serial: serial || undefined,
          pin,
        };
      })
      .filter((p: ParsedPinCard) => Boolean(p.pin));

    if (result.pins.length > 0) return result;
  }

  // 2. Check if tokenPayload has tokens array
  if (Array.isArray(tokenPayload?.tokens) && tokenPayload.tokens.length > 0) {
    result.pins = tokenPayload.tokens
      .map((tok: any, index: number) => ({
        id: `token-${index}`,
        pin: String(tok).trim(),
      }))
      .filter((p: ParsedPinCard) => Boolean(p.pin));

    if (result.pins.length > 0) return result;
  }

  // 3. Fallback string extraction
  const sourceText = String(
    rawToken ||
      tokenPayload?.purchased_code ||
      tokenPayload?.token ||
      tokenPayload?.Pin ||
      tokenPayload?.pin ||
      tokenPayload?.Token ||
      tokenPayload?.meter_token ||
      ""
  ).trim();

  if (!sourceText) {
    return result;
  }

  result.rawText = sourceText;

  // Electricity token handling
  if (categoryType === "electricity") {
    // Extract token digits
    const digitsOnly = sourceText.replace(/[^0-9]/g, "");
    const units =
      tokenPayload?.units ||
      tokenPayload?.content?.units ||
      tokenPayload?.rawTokenPayload?.units;

    const formatted =
      digitsOnly.length >= 16
        ? digitsOnly.replace(/(\d{4})(?=\d)/g, "$1 ")
        : sourceText;

    result.electricityToken = {
      raw: digitsOnly || sourceText,
      formatted,
      units: units ? String(units) : undefined,
    };
    return result;
  }

  // Clean leading prefix like "Token:", "Tokens:", "Pin:"
  let cleanText = sourceText.replace(/^Tokens?:\s*/i, "").replace(/^Pins?:\s*/i, "");

  // Check for delimiter separation (|| or \n or ;)
  const chunks = cleanText
    .split(/\|\||\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (chunks.length > 1 || /serial/i.test(cleanText) || /pin/i.test(cleanText)) {
    const parsedCards: ParsedPinCard[] = [];

    chunks.forEach((chunk, index) => {
      // Look for Serial and Pin patterns
      const serialMatch = chunk.match(
        /(?:Serial\s*(?:No|#)?|S\/N|SN)\s*[:=]\s*([A-Za-z0-9_-]+)/i
      );
      const pinMatch = chunk.match(
        /(?:PIN|pin|Code|code|Token|token)\s*[:=]\s*([A-Za-z0-9_-]+)/i
      );

      const serial = serialMatch ? serialMatch[1].trim() : undefined;
      let pin = pinMatch ? pinMatch[1].trim() : undefined;

      if (!pin) {
        // If no explicit pin label, try extracting leftover text after serial
        if (serialMatch) {
          const remainder = chunk.replace(serialMatch[0], "").replace(/[,:]/g, "").trim();
          if (remainder) pin = remainder;
        } else {
          // If no serial label, treat chunk as pure pin
          pin = chunk.trim();
        }
      }

      if (pin) {
        parsedCards.push({
          id: `pin-${index}`,
          serial,
          pin,
        });
      }
    });

    if (parsedCards.length > 0) {
      result.pins = parsedCards;
      return result;
    }
  }

  // Single token / PIN fallback
  if (categoryType === "education") {
    result.pins = [
      {
        id: "pin-0",
        pin: cleanText,
      },
    ];
  } else {
    result.genericToken = cleanText;
  }

  return result;
}

export function BillSuccessReceipt({ data, onDone }: BillSuccessReceiptProps) {
  const { colors, isDark } = useTheme();
  const viewShotRef = useRef<ViewShot>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const parsedTokens = useMemo(
    () => parseBillTokens(data.tokenPayload, data.rawToken, data.categoryType),
    [data.tokenPayload, data.rawToken, data.categoryType]
  );

  const formattedDate = useMemo(() => {
    return (data.timestamp || new Date()).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [data.timestamp]);

  const isElectricity = data.categoryType === "electricity";
  const isEducation = data.categoryType === "education";
  const Icon = isElectricity ? Zap : isEducation ? GraduationCap : Tv;

  // Copy helper with haptics & temporary feedback
  const triggerCopy = useCallback(async (text: string, id: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  }, []);

  const handleCopyAllPins = useCallback(() => {
    if (!parsedTokens.pins.length) return;
    const pinText = parsedTokens.pins
      .map((p, i) => {
        const s = p.serial ? ` (Serial: ${p.serial})` : "";
        return `${i + 1}. PIN: ${p.pin}${s}`;
      })
      .join("\n");

    const fullMessage = `${data.billerName} PINs:\n${pinText}`;
    triggerCopy(fullMessage, "all-pins");
  }, [parsedTokens.pins, data.billerName, triggerCopy]);

  const handleShare = useCallback(async () => {
    Haptics.selectionAsync();

    try {
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: "Share Transaction Receipt",
          });
          return;
        }
      }
    } catch (error) {
      console.log("[BillSuccessReceipt] ViewShot capture fallback to text:", error);
    }

    // Text share fallback
    let pinsText = "";
    if (parsedTokens.pins.length > 0) {
      pinsText =
        "\n\n🔑 PIN Details:\n" +
        parsedTokens.pins
          .map((p, idx) => `• PIN ${idx + 1}: ${p.pin}${p.serial ? ` (S/N: ${p.serial})` : ""}`)
          .join("\n");
    } else if (parsedTokens.electricityToken) {
      pinsText = `\n\n⚡ Meter Token: ${parsedTokens.electricityToken.formatted}`;
      if (parsedTokens.electricityToken.units) {
        pinsText += `\nUnits: ${parsedTokens.electricityToken.units}`;
      }
    }

    const shareBody =
      `🎉 Payment Receipt\n\n` +
      `📦 Service: ${data.billerName}\n` +
      (data.variationName ? `📑 Package: ${data.variationName}\n` : "") +
      (data.customerIdentifier ? `👤 Account: ${data.customerIdentifier}\n` : "") +
      `💰 Amount: ₦${data.amount.toLocaleString("en-NG")}\n` +
      `📅 Date: ${formattedDate}\n` +
      (data.transactionId ? `🔖 Ref: ${data.transactionId}\n` : "") +
      pinsText +
      `\n\n✅ Status: Successful`;

    await Share.share({
      title: `${data.billerName} Receipt`,
      message: shareBody,
    });
  }, [data, formattedDate, parsedTokens]);

  const subtitleText = useMemo(() => {
    if (isEducation) {
      const qty = data.quantity || parsedTokens.pins.length || 1;
      return `${data.billerName} (${qty} ${qty > 1 ? "PINs" : "PIN"})`;
    }
    if (data.customerIdentifier) {
      return `${data.billerName} • ${data.customerIdentifier}`;
    }
    if (data.phone) {
      return `${data.billerName} • ${data.phone}`;
    }
    return data.billerName;
  }, [data, isEducation, parsedTokens.pins.length]);

  return (
    <View style={styles.container}>
      {/* Capturable Receipt Container */}
      <ViewShot
        ref={viewShotRef}
        options={{ format: "png", quality: 1 }}
        style={[
          styles.receiptCard,
          {
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderColor: colors.border,
          },
        ]}
      >
        {/* Success Header */}
        <View style={styles.headerSection}>
          <View style={[styles.successBadge, { backgroundColor: `${colors.success}18` }]}>
            <CheckCircle2 size={36} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>
            Payment Successful!
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            {subtitleText}
          </Text>
        </View>

        {/* Amount Box */}
        <View style={[styles.amountContainer, { backgroundColor: isDark ? `${colors.primary}12` : "#F8FAFC" }]}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
            Amount Paid
          </Text>
          <Text style={[styles.amountValue, { color: colors.primary }]}>
            ₦{data.amount.toLocaleString("en-NG")}
          </Text>
        </View>

        {/* Tokens & PINs Section */}
        {parsedTokens.pins.length > 0 && (
          <View style={styles.pinsSection}>
            <View style={styles.pinsSectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {parsedTokens.pins.length > 1 ? `Purchased PINs (${parsedTokens.pins.length})` : "Purchased PIN"}
              </Text>
              {parsedTokens.pins.length > 1 && (
                <TouchableOpacity
                  style={[styles.copyAllButton, { backgroundColor: `${colors.primary}15` }]}
                  onPress={handleCopyAllPins}
                  activeOpacity={0.7}
                >
                  {copiedId === "all-pins" ? (
                    <Check size={14} color={colors.success} />
                  ) : (
                    <Copy size={14} color={colors.primary} />
                  )}
                  <Text
                    style={[
                      styles.copyAllText,
                      { color: copiedId === "all-pins" ? colors.success : colors.primary },
                    ]}
                  >
                    {copiedId === "all-pins" ? "Copied All!" : "Copy All PINs"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.pinsList}>
              {parsedTokens.pins.map((pinItem, idx) => {
                const isCopied = copiedId === pinItem.id;
                return (
                  <View
                    key={pinItem.id}
                    style={[
                      styles.pinCard,
                      {
                        backgroundColor: isDark ? colors.background : "#F8FAFC",
                        borderColor: isCopied ? colors.success : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.pinCardTop}>
                      <View style={[styles.pinBadge, { backgroundColor: `${colors.primary}15` }]}>
                        <Text style={[styles.pinBadgeText, { color: colors.primary }]}>
                          PIN #{idx + 1}
                        </Text>
                      </View>
                      {pinItem.serial ? (
                        <TouchableOpacity
                          style={styles.serialRow}
                          onPress={() => triggerCopy(pinItem.serial!, `serial-${pinItem.id}`)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.serialText, { color: colors.textSecondary }]}>
                            S/N: {pinItem.serial}
                          </Text>
                          {copiedId === `serial-${pinItem.id}` ? (
                            <Check size={12} color={colors.success} />
                          ) : (
                            <Copy size={12} color={colors.textTertiary} />
                          )}
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    <View style={styles.pinBodyRow}>
                      <Text
                        style={[styles.pinCode, { color: colors.foreground }]}
                        selectable
                      >
                        {pinItem.pin}
                      </Text>

                      <TouchableOpacity
                        style={[
                          styles.copyPinBtn,
                          {
                            backgroundColor: isCopied ? `${colors.success}20` : `${colors.primary}15`,
                            borderColor: isCopied ? colors.success : `${colors.primary}40`,
                          },
                        ]}
                        onPress={() => triggerCopy(pinItem.pin, pinItem.id)}
                        activeOpacity={0.7}
                      >
                        {isCopied ? (
                          <Check size={14} color={colors.success} />
                        ) : (
                          <Copy size={14} color={colors.primary} />
                        )}
                        <Text
                          style={[
                            styles.copyPinBtnText,
                            { color: isCopied ? colors.success : colors.primary },
                          ]}
                        >
                          {isCopied ? "Copied" : "Copy"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Electricity Token Section */}
        {parsedTokens.electricityToken && (
          <View style={styles.pinsSection}>
            <View style={styles.pinsSectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Electricity Token
              </Text>
              {parsedTokens.electricityToken.units && (
                <View style={[styles.unitsBadge, { backgroundColor: `${colors.primary}15` }]}>
                  <Zap size={13} color={colors.primary} />
                  <Text style={[styles.unitsText, { color: colors.primary }]}>
                    {parsedTokens.electricityToken.units} Units
                  </Text>
                </View>
              )}
            </View>

            <View
              style={[
                styles.tokenContainer,
                {
                  backgroundColor: isDark ? colors.background : "#F8FAFC",
                  borderColor: copiedId === "elec-token" ? colors.success : colors.border,
                },
              ]}
            >
              <Text style={[styles.tokenDigits, { color: colors.foreground }]} selectable>
                {parsedTokens.electricityToken.formatted}
              </Text>

              <TouchableOpacity
                style={[
                  styles.copyTokenBtn,
                  {
                    backgroundColor:
                      copiedId === "elec-token" ? `${colors.success}20` : colors.primary,
                  },
                ]}
                onPress={() =>
                  triggerCopy(
                    parsedTokens.electricityToken!.raw,
                    "elec-token"
                  )
                }
                activeOpacity={0.8}
              >
                {copiedId === "elec-token" ? (
                  <Check size={16} color={colors.success} />
                ) : (
                  <Copy size={16} color={colors.primaryForeground} />
                )}
                <Text
                  style={[
                    styles.copyTokenBtnText,
                    {
                      color:
                        copiedId === "elec-token"
                          ? colors.success
                          : colors.primaryForeground,
                    },
                  ]}
                >
                  {copiedId === "elec-token" ? "Token Copied!" : "Copy Token"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Generic Token Fallback */}
        {parsedTokens.genericToken && (
          <View style={styles.pinsSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 8 }]}>
              Token / Code
            </Text>
            <View
              style={[
                styles.tokenContainer,
                {
                  backgroundColor: isDark ? colors.background : "#F8FAFC",
                  borderColor: copiedId === "gen-token" ? colors.success : colors.border,
                },
              ]}
            >
              <Text style={[styles.tokenDigits, { color: colors.foreground }]} selectable>
                {parsedTokens.genericToken}
              </Text>
              <TouchableOpacity
                style={[
                  styles.copyTokenBtn,
                  {
                    backgroundColor:
                      copiedId === "gen-token" ? `${colors.success}20` : colors.primary,
                  },
                ]}
                onPress={() => triggerCopy(parsedTokens.genericToken!, "gen-token")}
                activeOpacity={0.8}
              >
                {copiedId === "gen-token" ? (
                  <Check size={16} color={colors.success} />
                ) : (
                  <Copy size={16} color={colors.primaryForeground} />
                )}
                <Text
                  style={[
                    styles.copyTokenBtnText,
                    {
                      color:
                        copiedId === "gen-token"
                          ? colors.success
                          : colors.primaryForeground,
                    },
                  ]}
                >
                  {copiedId === "gen-token" ? "Copied!" : "Copy Code"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Details Summary Table */}
        <View style={[styles.detailsCard, { borderColor: colors.border }]}>
          <DetailRow label="Service" value={data.billerName} />

          {data.variationName ? (
            <DetailRow
              label={isEducation ? "Exam Package" : isElectricity ? "Plan" : "Bouquet"}
              value={data.variationName}
            />
          ) : null}

          {data.customerIdentifier ? (
            <DetailRow
              label={
                isElectricity
                  ? "Meter Number"
                  : isEducation
                  ? "Profile ID"
                  : "Smartcard / IUC"
              }
              value={data.customerIdentifier}
            />
          ) : null}

          {data.customerName ? (
            <DetailRow label="Customer Name" value={data.customerName} />
          ) : null}

          {data.phone ? (
            <DetailRow label="Phone" value={data.phone} />
          ) : null}

          <DetailRow label="Date & Time" value={formattedDate} />

          {data.transactionId ? (
            <View style={styles.detailRowWithCopy}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Reference
              </Text>
              <TouchableOpacity
                style={styles.refContainer}
                onPress={() => triggerCopy(data.transactionId!, "ref")}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.refValue, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {data.transactionId}
                </Text>
                {copiedId === "ref" ? (
                  <Check size={13} color={colors.success} />
                ) : (
                  <Copy size={13} color={colors.textTertiary} />
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ViewShot>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.shareButton,
            {
              backgroundColor: isDark ? `${colors.primary}18` : "#EEF2FF",
              borderColor: colors.primary,
            },
          ]}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Share2 size={18} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>
            Share Receipt
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.doneButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={onDone}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: designTokens.spacing.md,
    paddingTop: designTokens.spacing.xs,
    paddingBottom: designTokens.spacing.md,
  },
  receiptCard: {
    width: "100%",
    borderRadius: designTokens.radius.xl,
    borderWidth: 1,
    padding: designTokens.spacing.md,
    gap: designTokens.spacing.md,
  },
  headerSection: {
    alignItems: "center",
    paddingTop: designTokens.spacing.xs,
  },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: designTokens.spacing.sm,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  successSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 3,
  },
  amountContainer: {
    borderRadius: designTokens.radius.lg,
    paddingVertical: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  pinsSection: {
    width: "100%",
    gap: 8,
  },
  pinsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  copyAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: designTokens.radius.md,
  },
  copyAllText: {
    fontSize: 12,
    fontWeight: "700",
  },
  pinsList: {
    gap: 8,
  },
  pinCard: {
    borderRadius: designTokens.radius.lg,
    borderWidth: 1,
    padding: designTokens.spacing.sm,
    gap: 6,
  },
  pinCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pinBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: designTokens.radius.sm,
  },
  pinBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  serialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  serialText: {
    fontSize: 12,
    fontWeight: "600",
  },
  pinBodyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  pinCode: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1.5,
    flex: 1,
  },
  copyPinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: designTokens.radius.md,
    borderWidth: 1,
  },
  copyPinBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  unitsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: designTokens.radius.sm,
  },
  unitsText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tokenContainer: {
    borderRadius: designTokens.radius.lg,
    borderWidth: 1,
    padding: designTokens.spacing.md,
    alignItems: "center",
    gap: 10,
  },
  tokenDigits: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  copyTokenBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    height: 44,
    borderRadius: designTokens.radius.md,
  },
  copyTokenBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  detailsCard: {
    borderTopWidth: 1,
    paddingTop: designTokens.spacing.sm,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  detailRowWithCopy: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
    flex: 1,
  },
  refContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: "65%",
  },
  refValue: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  actionsRow: {
    flexDirection: "row",
    gap: designTokens.spacing.sm,
    marginTop: designTokens.spacing.md,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: designTokens.radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  shareButton: {
    borderWidth: 1.5,
  },
  doneButton: {},
  actionButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
