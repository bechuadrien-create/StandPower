import React, { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type {
  CombatDrillSubType,
  MovementPattern,
} from '../services/exerciseMediaService';

export interface StickmanAnimatorProps {
  movementPattern: MovementPattern;
  combatSubType?: CombatDrillSubType;
  exerciseName: string;
  autoPlay?: boolean;
}

interface StickmanFrame {
  head: { cx: number; cy: number };
  neck: [number, number];
  hip: [number, number];
  shoulderL: [number, number];
  elbowL: [number, number];
  handL: [number, number];
  shoulderR: [number, number];
  elbowR: [number, number];
  handR: [number, number];
  kneeL: [number, number];
  footL: [number, number];
  kneeR: [number, number];
  footR: [number, number];
  propType?: 'barbell' | 'pullup_bar' | 'heavy_bag' | 'mat_only';
  barbellY?: number;
  barbellX?: number;
  arrowStart: [number, number];
  arrowEnd: [number, number];
  phaseLabel: string;
}

function getFramesForPattern(
  pattern: MovementPattern,
  subType?: CombatDrillSubType
): [StickmanFrame, StickmanFrame] {
  if (pattern === 'combat_ground' || pattern === 'combat_striking') {
    const resolvedSub =
      subType ?? (pattern === 'combat_striking' ? 'shadow_boxing' : 'shrimp');

    if (resolvedSub === 'shrimp') {
      return [
        {
          head: { cx: 65, cy: 138 },
          neck: [76, 142],
          hip: [120, 152],
          shoulderL: [80, 140],
          elbowL: [95, 125],
          handL: [110, 132],
          shoulderR: [82, 145],
          elbowR: [98, 132],
          handR: [114, 138],
          kneeL: [148, 122],
          footL: [165, 154],
          kneeR: [152, 126],
          footR: [170, 154],
          propType: 'mat_only',
          arrowStart: [122, 145],
          arrowEnd: [92, 118],
          phaseLabel: 'Posture 1 : Dos au sol, pieds ancrés près des fessiers, coudes fermés',
        },
        {
          head: { cx: 74, cy: 134 },
          neck: [84, 136],
          hip: [98, 124],
          shoulderL: [86, 136],
          elbowL: [106, 138],
          handL: [128, 144],
          shoulderR: [88, 140],
          elbowR: [108, 142],
          handR: [130, 148],
          kneeL: [138, 136],
          footL: [165, 154],
          kneeR: [144, 142],
          footR: [170, 154],
          propType: 'mat_only',
          arrowStart: [98, 124],
          arrowEnd: [78, 112],
          phaseLabel: 'Posture 2 : Pivot sur l’épaule et recul explosif du bassin (Hip Escape)',
        },
      ];
    }

    if (resolvedSub === 'sprawl') {
      return [
        {
          head: { cx: 95, cy: 56 },
          neck: [100, 68],
          hip: [112, 108],
          shoulderL: [96, 70],
          elbowL: [82, 88],
          handL: [72, 78],
          shoulderR: [104, 72],
          elbowR: [92, 92],
          handR: [80, 84],
          kneeL: [100, 132],
          footL: [96, 154],
          kneeR: [124, 132],
          footR: [130, 154],
          propType: 'mat_only',
          arrowStart: [112, 108],
          arrowEnd: [135, 146],
          phaseLabel: 'Posture 1 : Garde de lutte basse, appuis réactifs',
        },
        {
          head: { cx: 76, cy: 96 },
          neck: [86, 108],
          hip: [125, 144],
          shoulderL: [84, 108],
          elbowL: [78, 132],
          handL: [72, 154],
          shoulderR: [88, 110],
          elbowR: [84, 132],
          handR: [80, 154],
          kneeL: [158, 148],
          footL: [188, 152],
          kneeR: [162, 150],
          footR: [192, 154],
          propType: 'mat_only',
          arrowStart: [125, 120],
          arrowEnd: [125, 148],
          phaseLabel: 'Posture 2 : Sprawl — hanches lourdes vers le tatami, jambes projetées en arrière',
        },
      ];
    }

    if (resolvedSub === 'technical_standup') {
      return [
        {
          head: { cx: 82, cy: 102 },
          neck: [88, 114],
          hip: [102, 148],
          shoulderL: [84, 116],
          elbowL: [72, 134],
          handL: [64, 154],
          shoulderR: [92, 116],
          elbowR: [112, 112],
          handR: [132, 104],
          kneeL: [126, 126],
          footL: [144, 154],
          kneeR: [122, 144],
          footR: [136, 154],
          propType: 'mat_only',
          arrowStart: [102, 148],
          arrowEnd: [88, 106],
          phaseLabel: 'Posture 1 : Garde assise, main arrière au sol, bras avant en bouclier',
        },
        {
          head: { cx: 94, cy: 62 },
          neck: [98, 76],
          hip: [106, 114],
          shoulderL: [92, 78],
          elbowL: [76, 114],
          handL: [64, 154],
          shoulderR: [104, 76],
          elbowR: [124, 78],
          handR: [142, 72],
          kneeL: [126, 132],
          footL: [144, 154],
          kneeR: [84, 134],
          footR: [72, 154],
          propType: 'mat_only',
          arrowStart: [122, 144],
          arrowEnd: [74, 150],
          phaseLabel: 'Posture 2 : Passage de la jambe sous le bassin vers la base debout stable',
        },
      ];
    }

    if (resolvedSub === 'granby_roll' || resolvedSub === 'guard_retention') {
      return [
        {
          head: { cx: 88, cy: 122 },
          neck: [96, 132],
          hip: [128, 146],
          shoulderL: [94, 134],
          elbowL: [108, 120],
          handL: [122, 114],
          shoulderR: [98, 136],
          elbowR: [112, 124],
          handR: [126, 118],
          kneeL: [116, 114],
          footL: [134, 96],
          kneeR: [124, 118],
          footR: [142, 102],
          propType: 'mat_only',
          arrowStart: [128, 146],
          arrowEnd: [96, 98],
          phaseLabel: 'Posture 1 : Rétention / Granby — appui sur la ligne des épaules (jamais la nuque)',
        },
        {
          head: { cx: 108, cy: 136 },
          neck: [112, 142],
          hip: [104, 102],
          shoulderL: [108, 144],
          elbowL: [92, 132],
          handL: [84, 120],
          shoulderR: [116, 144],
          elbowR: [128, 132],
          handR: [136, 120],
          kneeL: [84, 112],
          footL: [68, 134],
          kneeR: [124, 112],
          footR: [142, 134],
          propType: 'mat_only',
          arrowStart: [104, 102],
          arrowEnd: [142, 128],
          phaseLabel: 'Posture 2 : Inversion du bassin au-dessus des épaules et remise en garde',
        },
      ];
    }

    if (resolvedSub === 'bridge') {
      return [
        {
          head: { cx: 68, cy: 144 },
          neck: [80, 146],
          hip: [122, 150],
          shoulderL: [82, 146],
          elbowL: [96, 132],
          handL: [106, 138],
          shoulderR: [84, 148],
          elbowR: [98, 134],
          handR: [108, 140],
          kneeL: [146, 124],
          footL: [164, 154],
          kneeR: [150, 126],
          footR: [168, 154],
          propType: 'mat_only',
          arrowStart: [122, 148],
          arrowEnd: [118, 108],
          phaseLabel: 'Posture 1 : Dos à plat, talons proches des fessiers',
        },
        {
          head: { cx: 68, cy: 142 },
          neck: [80, 142],
          hip: [120, 112],
          shoulderL: [82, 142],
          elbowL: [74, 124],
          handL: [62, 112],
          shoulderR: [84, 144],
          elbowR: [96, 126],
          handR: [108, 118],
          kneeL: [146, 120],
          footL: [164, 154],
          kneeR: [150, 122],
          footR: [168, 154],
          propType: 'mat_only',
          arrowStart: [120, 112],
          arrowEnd: [84, 96],
          phaseLabel: 'Posture 2 : Pontage puissant sur l’épaule (Upa sécuritaire)',
        },
      ];
    }

    // Shadow boxing / striking / takedown
    return [
      {
        head: { cx: 88, cy: 48 },
        neck: [90, 62],
        hip: [92, 104],
        shoulderL: [84, 64],
        elbowL: [96, 82],
        handL: [108, 66],
        shoulderR: [94, 64],
        elbowR: [102, 84],
        handR: [102, 68],
        kneeL: [82, 128],
        footL: [74, 154],
        kneeR: [104, 128],
        footR: [114, 154],
        propType: 'heavy_bag',
        arrowStart: [108, 66],
        arrowEnd: [148, 64],
        phaseLabel: 'Posture 1 : Garde haute compacte, menton rentré, appuis dynamiques',
      },
      {
        head: { cx: 96, cy: 48 },
        neck: [98, 62],
        hip: [98, 104],
        shoulderL: [92, 64],
        elbowL: [100, 82],
        handL: [104, 66],
        shoulderR: [104, 62],
        elbowR: [126, 62],
        handR: [148, 60],
        kneeL: [86, 128],
        footL: [76, 154],
        kneeR: [112, 128],
        footR: [120, 154],
        propType: 'heavy_bag',
        arrowStart: [118, 60],
        arrowEnd: [152, 60],
        phaseLabel: 'Posture 2 : Extension complète du bras avec rotation hanche/épaule',
      },
    ];
  }

  if (pattern === 'squat') {
    return [
      {
        head: { cx: 110, cy: 42 },
        neck: [110, 56],
        hip: [108, 98],
        shoulderL: [102, 58],
        elbowL: [94, 74],
        handL: [98, 58],
        shoulderR: [118, 58],
        elbowR: [126, 74],
        handR: [122, 58],
        kneeL: [104, 126],
        footL: [102, 154],
        kneeR: [114, 126],
        footR: [116, 154],
        propType: 'barbell',
        barbellX: 110,
        barbellY: 58,
        arrowStart: [145, 65],
        arrowEnd: [145, 110],
        phaseLabel: 'Posture 1 : Départ debout gainé, barre stable sur les trapèzes',
      },
      {
        head: { cx: 112, cy: 68 },
        neck: [110, 82],
        hip: [92, 118],
        shoulderL: [104, 84],
        elbowL: [96, 98],
        handL: [100, 84],
        shoulderR: [116, 84],
        elbowR: [124, 98],
        handR: [120, 84],
        kneeL: [122, 122],
        footL: [104, 154],
        kneeR: [128, 122],
        footR: [116, 154],
        propType: 'barbell',
        barbellX: 110,
        barbellY: 84,
        arrowStart: [145, 110],
        arrowEnd: [145, 65],
        phaseLabel: 'Posture 2 : Flexion complète sous la parallèle, buste gainé',
      },
    ];
  }

  if (pattern === 'hinge') {
    return [
      {
        head: { cx: 124, cy: 64 },
        neck: [116, 74],
        hip: [86, 102],
        shoulderL: [114, 76],
        elbowL: [114, 104],
        handL: [114, 130],
        shoulderR: [118, 76],
        elbowR: [118, 104],
        handR: [118, 130],
        kneeL: [104, 126],
        footL: [108, 154],
        kneeR: [110, 126],
        footR: [114, 154],
        propType: 'barbell',
        barbellX: 116,
        barbellY: 132,
        arrowStart: [86, 102],
        arrowEnd: [108, 96],
        phaseLabel: 'Posture 1 : Charnière de hanche (Hinge), dos neutre, tibias proches de la barre',
      },
      {
        head: { cx: 110, cy: 42 },
        neck: [110, 56],
        hip: [110, 98],
        shoulderL: [106, 58],
        elbowL: [106, 82],
        handL: [108, 104],
        shoulderR: [114, 58],
        elbowR: [114, 82],
        handR: [112, 104],
        kneeL: [108, 126],
        footL: [108, 154],
        kneeR: [114, 126],
        footR: [114, 154],
        propType: 'barbell',
        barbellX: 110,
        barbellY: 104,
        arrowStart: [142, 130],
        arrowEnd: [142, 96],
        phaseLabel: 'Posture 2 : Extension complète des hanches, fessiers contractés sans hyperextension',
      },
    ];
  }

  if (pattern === 'pull') {
    return [
      {
        head: { cx: 110, cy: 68 },
        neck: [110, 80],
        hip: [110, 118],
        shoulderL: [98, 80],
        elbowL: [90, 56],
        handL: [86, 34],
        shoulderR: [122, 80],
        elbowR: [130, 56],
        handR: [134, 34],
        kneeL: [104, 138],
        footL: [104, 154],
        kneeR: [116, 138],
        footR: [116, 154],
        propType: 'pullup_bar',
        arrowStart: [152, 95],
        arrowEnd: [152, 52],
        phaseLabel: 'Posture 1 : Suspension active, épaules basses engagées',
      },
      {
        head: { cx: 110, cy: 40 },
        neck: [110, 52],
        hip: [110, 92],
        shoulderL: [96, 54],
        elbowL: [82, 66],
        handL: [86, 34],
        shoulderR: [124, 54],
        elbowR: [138, 66],
        handR: [134, 34],
        kneeL: [104, 116],
        footL: [104, 134],
        kneeR: [116, 116],
        footR: [116, 134],
        propType: 'pullup_bar',
        arrowStart: [152, 52],
        arrowEnd: [152, 95],
        phaseLabel: 'Posture 2 : Tirage complet, coudes tirés vers les côtes, poitrine haute',
      },
    ];
  }

  if (pattern === 'core') {
    return [
      {
        head: { cx: 66, cy: 112 },
        neck: [78, 116],
        hip: [122, 124],
        shoulderL: [80, 116],
        elbowL: [78, 144],
        handL: [64, 144],
        shoulderR: [82, 118],
        elbowR: [82, 146],
        handR: [68, 146],
        kneeL: [152, 136],
        footL: [178, 152],
        kneeR: [156, 138],
        footR: [182, 154],
        propType: 'mat_only',
        arrowStart: [122, 112],
        arrowEnd: [122, 126],
        phaseLabel: 'Posture 1 : Alignement segmentaire épaules-bassin-chevilles',
      },
      {
        head: { cx: 66, cy: 110 },
        neck: [78, 114],
        hip: [122, 120],
        shoulderL: [80, 114],
        elbowL: [74, 144],
        handL: [58, 144],
        shoulderR: [82, 116],
        elbowR: [78, 146],
        handR: [62, 146],
        kneeL: [152, 134],
        footL: [178, 152],
        kneeR: [156, 136],
        footR: [182, 154],
        propType: 'mat_only',
        arrowStart: [78, 144],
        arrowEnd: [122, 144],
        phaseLabel: 'Posture 2 : Rétroversion du bassin et traction isométrique des coudes vers les pointes de pieds',
      },
    ];
  }

  // Default: push (Développé / Push-up / Press)
  return [
    {
      head: { cx: 110, cy: 48 },
      neck: [110, 62],
      hip: [110, 104],
      shoulderL: [96, 64],
      elbowL: [82, 82],
      handL: [88, 60],
      shoulderR: [124, 64],
      elbowR: [138, 82],
      handR: [132, 60],
      kneeL: [104, 128],
      footL: [102, 154],
      kneeR: [116, 128],
      footR: [118, 154],
      propType: 'barbell',
      barbellX: 110,
      barbellY: 60,
      arrowStart: [154, 64],
      arrowEnd: [154, 24],
      phaseLabel: 'Posture 1 : Phase excentrique contrôlée, omoplates resserrées, avant-bras verticaux',
    },
    {
      head: { cx: 110, cy: 48 },
      neck: [110, 62],
      hip: [110, 104],
      shoulderL: [98, 62],
      elbowL: [94, 42],
      handL: [94, 22],
      shoulderR: [122, 62],
      elbowR: [126, 42],
      handR: [126, 22],
      kneeL: [104, 128],
      footL: [102, 154],
      kneeR: [116, 128],
      footR: [118, 154],
      propType: 'barbell',
      barbellX: 110,
      barbellY: 22,
      arrowStart: [154, 24],
      arrowEnd: [154, 64],
      phaseLabel: 'Posture 2 : Poussée concentrique complète, gainage verrouillé',
    },
  ];
}

export const StickmanAnimator: React.FC<StickmanAnimatorProps> = ({
  movementPattern,
  combatSubType,
  exerciseName,
  autoPlay = true,
}) => {
  const [stepIndex, setStepIndex] = useState<0 | 1>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev === 0 ? 1 : 0));
    }, 900);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const [frame0, frame1] = getFramesForPattern(movementPattern, combatSubType);
  const currentFrame = stepIndex === 0 ? frame0 : frame1;

  const isCombat =
    movementPattern === 'combat_ground' || movementPattern === 'combat_striking';
  const strokeColor = isCombat ? '#8b5cf6' : '#10b981'; // violet-500 for combat, emerald-500 for strength
  const secondaryStroke = '#d946ef'; // fuchsia-500 for arrows / highlights

  return (
    <div className="rounded-xl border border-sp-border bg-zinc-950/90 p-3 text-zinc-100 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: strokeColor }}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Cinématique Stickman 2D ({isCombat ? 'Combat / JJB' : 'Biomécanique'})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? 'Mettre en pause l’animation' : 'Lire l’animation'}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-700 hover:bg-zinc-800"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause' : 'Lecture'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setStepIndex((prev) => (prev === 0 ? 1 : 0));
            }}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-700 hover:bg-zinc-800"
          >
            Position {stepIndex + 1}/2
          </button>
        </div>
      </div>

      <div className="relative flex items-center justify-center bg-zinc-900/80 rounded-xl border border-zinc-800 overflow-hidden py-2">
        <svg
          viewBox="0 0 220 175"
          className="w-full max-w-[300px] h-44"
          role="img"
          aria-label={`Animation cinématique pour ${exerciseName}`}
        >
          <defs>
            <marker
              id="stickman-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill={secondaryStroke} />
            </marker>
          </defs>

          {/* Ligne de sol / tatami */}
          <line
            x1="20"
            y1="156"
            x2="200"
            y2="156"
            stroke="#3f3f46"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Barre de traction si pull */}
          {currentFrame.propType === 'pullup_bar' && (
            <g>
              <line
                x1="55"
                y1="32"
                x2="165"
                y2="32"
                stroke="#a1a1aa"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <line x1="65" y1="32" x2="65" y2="156" stroke="#3f3f46" strokeWidth="2.5" />
              <line x1="155" y1="32" x2="155" y2="156" stroke="#3f3f46" strokeWidth="2.5" />
            </g>
          )}

          {/* Sac de frappe si combat_striking */}
          {currentFrame.propType === 'heavy_bag' && (
            <g>
              <line x1="172" y1="10" x2="172" y2="34" stroke="#71717a" strokeWidth="2" />
              <rect
                x="156"
                y="34"
                width="32"
                height="92"
                rx="10"
                fill="#27272a"
                stroke="#8b5cf6"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Membres arrières (gauche) */}
          <line
            x1={currentFrame.hip[0]}
            y1={currentFrame.hip[1]}
            x2={currentFrame.kneeL[0]}
            y2={currentFrame.kneeL[1]}
            stroke={strokeColor}
            strokeOpacity="0.6"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <line
            x1={currentFrame.kneeL[0]}
            y1={currentFrame.kneeL[1]}
            x2={currentFrame.footL[0]}
            y2={currentFrame.footL[1]}
            stroke={strokeColor}
            strokeOpacity="0.6"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <line
            x1={currentFrame.shoulderL[0]}
            y1={currentFrame.shoulderL[1]}
            x2={currentFrame.elbowL[0]}
            y2={currentFrame.elbowL[1]}
            stroke={strokeColor}
            strokeOpacity="0.65"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1={currentFrame.elbowL[0]}
            y1={currentFrame.elbowL[1]}
            x2={currentFrame.handL[0]}
            y2={currentFrame.handL[1]}
            stroke={strokeColor}
            strokeOpacity="0.65"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Colonne vertébrale / Tronc */}
          <line
            x1={currentFrame.neck[0]}
            y1={currentFrame.neck[1]}
            x2={currentFrame.hip[0]}
            y2={currentFrame.hip[1]}
            stroke={strokeColor}
            strokeWidth="5.5"
            strokeLinecap="round"
          />

          {/* Tête */}
          <circle
            cx={currentFrame.head.cx}
            cy={currentFrame.head.cy}
            r="10"
            fill="#18181b"
            stroke={strokeColor}
            strokeWidth="3.5"
          />

          {/* Membres avant (droite) */}
          <line
            x1={currentFrame.hip[0]}
            y1={currentFrame.hip[1]}
            x2={currentFrame.kneeR[0]}
            y2={currentFrame.kneeR[1]}
            stroke={strokeColor}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <line
            x1={currentFrame.kneeR[0]}
            y1={currentFrame.kneeR[1]}
            x2={currentFrame.footR[0]}
            y2={currentFrame.footR[1]}
            stroke={strokeColor}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <line
            x1={currentFrame.shoulderR[0]}
            y1={currentFrame.shoulderR[1]}
            x2={currentFrame.elbowR[0]}
            y2={currentFrame.elbowR[1]}
            stroke={strokeColor}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1={currentFrame.elbowR[0]}
            y1={currentFrame.elbowR[1]}
            x2={currentFrame.handR[0]}
            y2={currentFrame.handR[1]}
            stroke={strokeColor}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Articulations clés */}
          <circle cx={currentFrame.hip[0]} cy={currentFrame.hip[1]} r="3.5" fill="#fafafa" />
          <circle cx={currentFrame.kneeR[0]} cy={currentFrame.kneeR[1]} r="3" fill="#fafafa" />
          <circle cx={currentFrame.elbowR[0]} cy={currentFrame.elbowR[1]} r="3" fill="#fafafa" />

          {/* Barre olympique + disques si barbell */}
          {currentFrame.propType === 'barbell' &&
            currentFrame.barbellX !== undefined &&
            currentFrame.barbellY !== undefined && (
              <g>
                <line
                  x1={currentFrame.barbellX - 34}
                  y1={currentFrame.barbellY}
                  x2={currentFrame.barbellX + 34}
                  y2={currentFrame.barbellY}
                  stroke="#e4e4e7"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <rect
                  x={currentFrame.barbellX - 30}
                  y={currentFrame.barbellY - 9}
                  width="5"
                  height="18"
                  rx="1.5"
                  fill="#10b981"
                />
                <rect
                  x={currentFrame.barbellX + 25}
                  y={currentFrame.barbellY - 9}
                  width="5"
                  height="18"
                  rx="1.5"
                  fill="#10b981"
                />
              </g>
            )}

          {/* Flèche directionnelle du mouvement */}
          <line
            x1={currentFrame.arrowStart[0]}
            y1={currentFrame.arrowStart[1]}
            x2={currentFrame.arrowEnd[0]}
            y2={currentFrame.arrowEnd[1]}
            stroke={secondaryStroke}
            strokeWidth="2.5"
            strokeDasharray="4 2"
            markerEnd="url(#stickman-arrow)"
          />
        </svg>
      </div>

      <p className="text-xs text-zinc-300 text-center font-medium">
        {currentFrame.phaseLabel}
      </p>
    </div>
  );
};
