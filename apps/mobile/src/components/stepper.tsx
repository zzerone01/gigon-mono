import { StyleSheet, Text, View } from "react-native";

import { font, palette } from "../theme";
import { Icon } from "./icon";

/**
 * State-machine progress stepper (APPLIED → MATCHED → ON SITE → DONE).
 * `labels` off gives the compact variant used on the My Gigs card.
 */
export function Stepper({
  codes,
  index,
  labels = true,
}: {
  codes: string[];
  index: number;
  labels?: boolean;
}) {
  const size = labels ? 22 : 18;
  return (
    <View style={styles.row}>
      {codes.map((code, i) => {
        const done = i < index;
        const current = i === index;
        const bg = done ? palette.royal : current ? palette.amber : palette.white;
        const bd = done ? palette.royal : current ? palette.amber : palette.line;
        return (
          <View key={code} style={[styles.segment, i === codes.length - 1 && { flex: 0 }]}>
            <View style={labels ? styles.stepCol : undefined}>
              <View
                style={[
                  styles.dot,
                  { width: size, height: size, backgroundColor: bg, borderColor: bd },
                ]}
              >
                {done ? (
                  <Icon name="check" size={labels ? 12 : 10} color={palette.white} strokeWidth={3.2} />
                ) : (
                  <Text
                    style={[
                      styles.num,
                      { fontSize: labels ? 10 : 9, color: current ? palette.ink : palette.muted },
                    ]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              {labels && (
                <Text
                  style={[
                    styles.code,
                    {
                      color: current ? palette.ink : done ? palette.royal : palette.muted,
                      fontWeight: current ? "700" : "500",
                    },
                  ]}
                >
                  {code}
                </Text>
              )}
            </View>
            {i < codes.length - 1 && (
              <View
                style={[
                  styles.line,
                  { backgroundColor: done ? palette.royal : palette.line },
                  labels && { marginTop: 10, alignSelf: "flex-start" },
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  segment: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  stepCol: {
    alignItems: "center",
    gap: 6,
    width: 62,
  },
  dot: {
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  num: {
    fontFamily: font.sansBold,
  },
  code: {
    fontFamily: font.mono,
    fontSize: 8.5,
    letterSpacing: 0.2,
  },
  line: {
    flex: 1,
    height: 2,
  },
});
