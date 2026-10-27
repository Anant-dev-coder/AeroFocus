import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

const STAGE_NAMES = [
  'CLEAR-MINDED',
  'A LITTLE FOGGY',
  'LOSING THE PLOT',
  'CRACKING',
  'FULL BRAINROT',
];

const STAGE_COLORS = [
  'brainHealthy',
  'brainTired',
  'brainStrained',
  'brainCracked',
  'brainRotted',
] as const;

export function brainStageForScrolls(scrolls: number): number {
  if (scrolls >= 100) return 4;
  if (scrolls >= 50) return 3;
  if (scrolls >= 25) return 2;
  if (scrolls >= 10) return 1;
  return 0;
}

export function brainStageName(stage: number): string {
  return STAGE_NAMES[Math.min(Math.max(stage, 0), STAGE_NAMES.length - 1)];
}

export function BrainVisual({
  scrolls,
  size = 220,
}: {
  scrolls: number;
  size?: number;
}) {
  const colors = useColors();
  const stage = brainStageForScrolls(scrolls);
  const brainColor = colors[STAGE_COLORS[stage]];
  const lineColor = stage === 4 ? colors.background : colors.border;
  const shapeOpacity = stage === 4 ? 0.78 : 1;

  return (
    <Svg width={size} height={size * 0.92} viewBox="0 0 220 202">
      <Defs>
        <LinearGradient id="brainGlow" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={brainColor} stopOpacity={0.9} />
          <Stop offset="1" stopColor={brainColor} stopOpacity={0.42} />
        </LinearGradient>
      </Defs>
      <Circle
        cx="110"
        cy="101"
        r="91"
        fill={colors.card}
        stroke={brainColor}
        strokeOpacity={stage === 0 ? 0.5 : 0.25}
        strokeWidth="1.5"
      />
      <Circle
        cx="110"
        cy="101"
        r="76"
        fill="none"
        stroke={brainColor}
        strokeOpacity="0.12"
        strokeWidth="1"
      />
      <Path
        d="M107 53c-10-15-27-18-39-7-13-1-23 10-21 23-14 8-15 25-3 35-6 13 3 28 18 29 4 15 21 20 34 10l11-8V53Z"
        fill="url(#brainGlow)"
        stroke={brainColor}
        strokeWidth="3"
        opacity={shapeOpacity}
      />
      <Path
        d="M113 53c10-15 27-18 39-7 13-1 23 10 21 23 14 8 15 25 3 35 6 13-3 28-18 29-4 15-21 20-34 10l-11-8V53Z"
        fill="url(#brainGlow)"
        stroke={brainColor}
        strokeWidth="3"
        opacity={shapeOpacity}
      />
      <Path
        d="M109 56v78M78 59c12 4 14 12 7 20-7 8-16 8-24 4M66 96c13-7 24-1 24 10 0 8-7 12-17 14M89 51c-3 10 2 17 11 18M142 59c-12 4-14 12-7 20 7 8 16 8 24 4M154 96c-13-7-24-1-24 10 0 8 7 12 17 14M131 51c3 10-2 17-11 18"
        fill="none"
        stroke={lineColor}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {stage >= 3 ? (
        <>
          <Path
            d="m81 72 8 9-8 9 7 8-7 10M144 74l-8 10 8 8-6 9 4 9"
            fill="none"
            stroke={colors.background}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="73" cy="129" r="3.5" fill={brainColor} />
          <Circle cx="151" cy="130" r="2.5" fill={brainColor} />
        </>
      ) : null}
      {stage === 4 ? (
        <>
          <Path
            d="M73 139c-2 10 5 14 9 21 4-8 9-13 7-22M129 139c-2 8 3 12 7 19 3-7 7-11 6-18"
            fill={colors.brainRotted}
            stroke={colors.brainRotted}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <Ellipse cx="110" cy="156" rx="13" ry="5" fill={colors.brainRotted} />
        </>
      ) : null}
    </Svg>
  );
}
