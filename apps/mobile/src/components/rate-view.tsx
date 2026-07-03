import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { font, palette, radius } from "../theme";
import { Pop } from "./animated-bits";
import { Icon } from "./icon";
import { Press } from "./ui";

/** Shared post-completion rating screen (worker→business and business→worker). */
export function RateView({
  forName,
  paySub,
  note,
  tags,
  selectedTags,
  stars,
  comment,
  placeholder,
  onStar,
  onToggleTag,
  onComment,
  onSubmit,
  onSkip,
}: {
  forName: string;
  paySub: string;
  note: string;
  tags: string[];
  selectedTags: Record<string, boolean>;
  stars: number;
  comment: string;
  placeholder: string;
  onStar: (n: number) => void;
  onToggleTag: (tag: string) => void;
  onComment: (v: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  const insets = useSafeAreaInsets();
  const canSubmit = stars > 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pop>
          <View style={styles.check}>
            <Icon name="check" size={30} color={palette.white} strokeWidth={2.6} />
          </View>
        </Pop>
        <View style={{ gap: 6, alignItems: "center" }}>
          <Text style={styles.heading}>Gig complete!</Text>
          <Text style={styles.paySub}>{paySub}</Text>
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>COMPLETED · PIN VERIFIED</Text>
          </View>
        </View>
        <View style={{ gap: 11, alignItems: "center", width: "100%", marginTop: 2 }}>
          <Text style={styles.question}>How was {forName}?</Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Press key={i} style={styles.starBtn} onPress={() => onStar(i)} haptic={false}>
                <Icon name="star" size={34} fill={i <= stars ? palette.amber : palette.line} />
              </Press>
            ))}
          </View>
          <View style={styles.tagsRow}>
            {tags.map((tag) => {
              const on = !!selectedTags[tag];
              return (
                <Press
                  key={tag}
                  onPress={() => onToggleTag(tag)}
                  haptic={false}
                  style={[
                    styles.tag,
                    on
                      ? { backgroundColor: palette.tint, borderColor: palette.royal }
                      : { backgroundColor: palette.white, borderColor: palette.line },
                  ]}
                >
                  <Text style={[styles.tagText, { color: on ? palette.royalDark : palette.slate }]}>
                    {tag}
                  </Text>
                </Press>
              );
            })}
          </View>
          <TextInput
            value={comment}
            onChangeText={onComment}
            placeholder={placeholder}
            placeholderTextColor={palette.muted}
            multiline
            style={styles.textArea}
          />
        </View>
        <Text style={styles.note}>{note}</Text>
      </ScrollView>
      <View style={{ paddingHorizontal: 26, paddingTop: 12, paddingBottom: insets.bottom + 18, gap: 6 }}>
        <Press
          style={[styles.cta, { backgroundColor: canSubmit ? palette.amber : palette.line }]}
          onPress={onSubmit}
          disabled={!canSubmit}
        >
          <Text style={[styles.ctaLabel, { color: canSubmit ? palette.ink : palette.muted }]}>
            Post review
          </Text>
        </Press>
        <Press style={{ padding: 6, alignSelf: "center" }} onPress={onSkip} haptic={false}>
          <Text style={styles.skipLabel}>Skip for now</Text>
        </Press>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.white,
  },
  content: {
    paddingTop: 34,
    paddingHorizontal: 26,
    paddingBottom: 20,
    gap: 16,
    alignItems: "center",
  },
  check: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: palette.success,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontFamily: font.displayBold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: palette.ink,
  },
  paySub: {
    fontFamily: font.sans,
    fontSize: 13,
    color: palette.slate,
  },
  completedBadge: {
    borderWidth: 1,
    borderColor: palette.successBorder,
    backgroundColor: palette.successBg,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  completedBadgeText: {
    fontFamily: font.mono,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: palette.success,
  },
  question: {
    fontFamily: font.sansSemiBold,
    fontSize: 13.5,
    color: palette.ink,
  },
  starBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "center",
  },
  tag: {
    height: 32,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tagText: {
    fontFamily: font.sansMedium,
    fontSize: 12,
  },
  textArea: {
    width: "100%",
    minHeight: 72,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontFamily: font.sans,
    fontSize: 13,
    lineHeight: 19.5,
    color: palette.ink,
    textAlignVertical: "top",
  },
  note: {
    fontFamily: font.sans,
    fontSize: 11,
    lineHeight: 17,
    color: palette.muted,
    textAlign: "center",
  },
  cta: {
    height: 50,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 15,
  },
  skipLabel: {
    fontFamily: font.sans,
    fontSize: 12.5,
    color: palette.muted,
  },
});
