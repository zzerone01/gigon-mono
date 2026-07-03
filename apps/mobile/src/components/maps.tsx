import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";

import { font, palette } from "../theme";
import { PulseRing } from "./animated-bits";

/**
 * Stylized Mactan pilot-zone maps, ported from the design's inline SVGs.
 * Placeholder art until a real map provider lands (per the pilot scope).
 */

/** Full-screen explore map (412×640 art). */
export function ExploreMapArt() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 412 640"
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFill}
    >
      <Rect width={412} height={640} fill={palette.tintSoft} />
      <Path
        d="M316 0 L412 0 L412 640 L236 640 C270 520 322 468 310 380 C298 296 352 238 332 150 C322 102 310 56 316 0 Z"
        fill={palette.mapWater}
      />
      <Path
        d="M316 0 C310 56 322 102 332 150 C352 238 298 296 310 380 C322 468 270 520 236 640"
        fill="none"
        stroke={palette.mapWaterEdge}
        strokeWidth={1.5}
      />
      <Rect x={36} y={88} width={82} height={54} rx={8} fill={palette.mapBlock} />
      <Rect x={180} y={470} width={66} height={44} rx={8} fill={palette.mapBlock} />
      <Path d="M0 214 L412 108" stroke={palette.mapRoadShadow} strokeWidth={16} />
      <Path d="M0 214 L412 108" stroke={palette.mapRoad} strokeWidth={12} />
      <Path d="M96 0 L136 640" stroke={palette.mapRoad} strokeWidth={8} />
      <Path d="M0 356 L340 402" stroke={palette.mapRoad} strokeWidth={8} />
      <Path d="M0 500 L280 540" stroke={palette.mapRoadSoft} strokeWidth={6} />
      <Path d="M236 0 L258 180" stroke={palette.mapRoadSoft} strokeWidth={6} />
      <Path d="M170 120 L200 640" stroke={palette.mapRoadSoft} strokeWidth={5} />
      <Path d="M40 460 C120 430 180 450 260 420" stroke={palette.mapRoadSoft} strokeWidth={5} fill="none" />
      <SvgText x={66} y={170} fontSize={10} fill={palette.muted} fontFamily={font.sans}>
        Pusok
      </SvgText>
      <SvgText x={52} y={392} fontSize={10} fill={palette.muted} fontFamily={font.sans}>
        Basak
      </SvgText>
      <SvgText x={212} y={556} fontSize={10} fill={palette.muted} fontFamily={font.sans}>
        Marigondon
      </SvgText>
      <SvgText x={268} y={318} fontSize={10} fill={palette.muted} fontFamily={font.sans}>
        Mactan Newtown
      </SvgText>
      <SvgText
        x={333}
        y={480}
        fontSize={9.5}
        fill="#7D96C9"
        fontStyle="italic"
        fontFamily={font.sans}
        transform="rotate(-73 343 480)"
      >
        Hilutungan Channel
      </SvgText>
      <SvgText
        x={148}
        y={198}
        fontSize={8.5}
        fill={palette.mapLabel}
        fontFamily={font.sans}
        transform="rotate(-14.5 148 198)"
      >
        M.L. Quezon National Hwy
      </SvgText>
      <Circle
        cx={200}
        cy={352}
        r={205}
        fill="none"
        stroke={palette.royal}
        strokeWidth={1.5}
        strokeDasharray="7 7"
        opacity={0.4}
      />
    </Svg>
  );
}

/** "YOU" marker with sonar pulse, absolutely positioned by the parent. */
export function YouMarker({ label = true }: { label?: boolean }) {
  return (
    <View style={youStyles.wrap}>
      <PulseRing size={52} style={{ left: -26 + 8.5, top: -26 + 8.5 }} />
      <View style={youStyles.dot} />
      {label && (
        <View style={youStyles.tag}>
          <Text style={youStyles.tagText}>YOU</Text>
        </View>
      )}
    </View>
  );
}

const youStyles = StyleSheet.create({
  wrap: {
    width: 17,
    height: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 17,
    height: 17,
    borderRadius: 999,
    backgroundColor: palette.amber,
    borderWidth: 3,
    borderColor: palette.white,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  tag: {
    position: "absolute",
    top: 20,
    backgroundColor: palette.ink,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  tagText: {
    fontFamily: font.sansSemiBold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    color: palette.white,
  },
});

/** Onboarding location-permission map (412×300 art). */
export function OnboardingMapArt() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 412 300"
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFill}
    >
      <Rect width={412} height={300} fill={palette.tintSoft} />
      <Path
        d="M310 0 L412 0 L412 300 L250 300 C285 240 320 200 312 150 C305 105 315 50 310 0 Z"
        fill={palette.mapWater}
      />
      <Rect x={40} y={40} width={70} height={46} rx={6} fill={palette.mapBlock} />
      <Path d="M0 150 L412 96" stroke={palette.mapRoad} strokeWidth={12} />
      <Path d="M120 0 L150 300" stroke={palette.mapRoad} strokeWidth={7} />
      <Path d="M0 230 L300 260" stroke={palette.mapRoad} strokeWidth={7} />
      <Path d="M230 0 L250 140" stroke={palette.mapRoadSoft} strokeWidth={5} />
      <Circle
        cx={206}
        cy={160}
        r={120}
        fill="none"
        stroke={palette.royal}
        strokeWidth={1.5}
        strokeDasharray="6 6"
        opacity={0.5}
      />
    </Svg>
  );
}

/** Gig-detail header map (412×240 art) with a dashed walk line. */
export function DetailMapArt() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 412 240"
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFill}
    >
      <Rect width={412} height={240} fill={palette.tintSoft} />
      <Path
        d="M320 0 L412 0 L412 240 L280 240 C300 170 330 120 322 60 C319 38 318 20 320 0 Z"
        fill={palette.mapWater}
      />
      <Path d="M0 150 L412 92" stroke={palette.mapRoad} strokeWidth={11} />
      <Path d="M120 0 L146 240" stroke={palette.mapRoad} strokeWidth={7} />
      <Path d="M0 210 L320 236" stroke={palette.mapRoadSoft} strokeWidth={5} />
      <Rect x={40} y={34} width={64} height={42} rx={8} fill={palette.mapBlock} />
      <Line x1={206} y1={120} x2={152} y2={178} stroke={palette.royal} strokeWidth={1.5} strokeDasharray="4 4" />
    </Svg>
  );
}

/** Post-form location-pin map (412×180 art). */
export function PostMapArt() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 412 180"
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFill}
    >
      <Rect width={412} height={180} fill={palette.tintSoft} />
      <Path
        d="M330 0 L412 0 L412 180 L300 180 C315 120 328 60 330 0 Z"
        fill={palette.mapWater}
      />
      <Path d="M0 110 L412 70" stroke={palette.mapRoad} strokeWidth={10} />
      <Path d="M130 0 L150 180" stroke={palette.mapRoad} strokeWidth={6} />
      <Path d="M0 160 L300 174" stroke={palette.mapRoadSoft} strokeWidth={4} />
      <Rect x={46} y={26} width={56} height={36} rx={7} fill={palette.mapBlock} />
    </Svg>
  );
}

/** Price map-pin (label + pointer), used on the map view and gig detail. */
export function PricePin({ label, bg = palette.royal }: { label: string; bg?: string }) {
  return (
    <View style={pinStyles.wrap}>
      <View style={[pinStyles.bubble, { backgroundColor: bg }]}>
        <Text style={pinStyles.label}>{label}</Text>
      </View>
      <View style={[pinStyles.pointer, { borderTopColor: bg }]} />
    </View>
  );
}

const pinStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  bubble: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  label: {
    fontFamily: font.displayBold,
    fontSize: 12.5,
    letterSpacing: -0.1,
    color: palette.white,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
