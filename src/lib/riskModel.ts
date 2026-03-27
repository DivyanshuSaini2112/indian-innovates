type RiskFeatures = {
  rainfall24h: number;
  rainfall7d: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
};

type Sample = {
  x: number[];
  y: number;
};

type TreeNode =
  | { type: "leaf"; value: number }
  | { type: "split"; featureIndex: number; threshold: number; left: TreeNode; right: TreeNode };

type ModelState = {
  sampleCount: number;
  updatedAt: string;
  forest: TreeNode[];
};

const FEATURE_COUNT = 5;
const MIN_SAMPLES_FOR_PREDICT = 30;  // Lower threshold: start predicting sooner
const MAX_SAMPLES = 2500;
const RETRAIN_EVERY = 10;  // Retrain more frequently (was 20) for better rainfall learning
const TREE_COUNT = 21;
const MAX_DEPTH = 5;
const MIN_LEAF_SIZE = 6;  // Smaller leaves for better rainfall pattern capture
const FEATURES_PER_SPLIT = 3;
const THRESHOLD_CANDIDATES = 12;

const state: ModelState = {
  sampleCount: 0,
  updatedAt: new Date(0).toISOString(),
  forest: [],
};
const samples: Sample[] = [];

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function toVector(f: RiskFeatures): number[] {
  return [
    clamp(f.rainfall24h / 120, 0, 2),  // 120mm is extreme rain in 24h
    clamp(f.rainfall7d / 600, 0, 2),   // 600mm is extreme rain in 7d
    clamp(f.temperature / 50, 0, 1.5),
    clamp(f.humidity / 100, 0, 1.5),
    clamp(f.windSpeed / 120, 0, 1.5),
  ];
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
}

function variance(values: number[]): number {
  if (values.length <= 1) return 0;
  const m = mean(values);
  return values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length;
}

function pickRandomFeatureIndexes(): number[] {
  const idx = Array.from({ length: FEATURE_COUNT }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, FEATURES_PER_SPLIT);
}

function buildTree(data: Sample[], depth: number): TreeNode {
  const ys = data.map((s) => s.y);
  if (data.length <= MIN_LEAF_SIZE || depth >= MAX_DEPTH || variance(ys) < 0.5) {
    return { type: "leaf", value: mean(ys) };
  }

  const featureIndexes = pickRandomFeatureIndexes();
  let bestGain = -Infinity;
  let bestSplit:
    | { featureIndex: number; threshold: number; left: Sample[]; right: Sample[] }
    | undefined;

  for (const featureIndex of featureIndexes) {
    const featureValues = data.map((s) => s.x[featureIndex]);
    const minV = Math.min(...featureValues);
    const maxV = Math.max(...featureValues);
    if (maxV - minV < 0.0001) continue;

    for (let i = 0; i < THRESHOLD_CANDIDATES; i++) {
      const threshold = minV + ((i + 1) / (THRESHOLD_CANDIDATES + 1)) * (maxV - minV);
      const left = data.filter((s) => s.x[featureIndex] <= threshold);
      const right = data.filter((s) => s.x[featureIndex] > threshold);
      if (left.length < MIN_LEAF_SIZE || right.length < MIN_LEAF_SIZE) continue;

      const parentVar = variance(ys);
      const weightedVar =
        (left.length / data.length) * variance(left.map((s) => s.y)) +
        (right.length / data.length) * variance(right.map((s) => s.y));
      const gain = parentVar - weightedVar;
      if (gain > bestGain) {
        bestGain = gain;
        bestSplit = { featureIndex, threshold, left, right };
      }
    }
  }

  if (!bestSplit) return { type: "leaf", value: mean(ys) };

  return {
    type: "split",
    featureIndex: bestSplit.featureIndex,
    threshold: bestSplit.threshold,
    left: buildTree(bestSplit.left, depth + 1),
    right: buildTree(bestSplit.right, depth + 1),
  };
}

function bootstrap(data: Sample[]): Sample[] {
  const out: Sample[] = [];
  for (let i = 0; i < data.length; i++) {
    out.push(data[Math.floor(Math.random() * data.length)]);
  }
  return out;
}

function predictTree(node: TreeNode, x: number[]): number {
  if (node.type === "leaf") return node.value;
  if (x[node.featureIndex] <= node.threshold) return predictTree(node.left, x);
  return predictTree(node.right, x);
}

function retrainForest() {
  if (samples.length < MIN_SAMPLES_FOR_PREDICT) return;
  const forest: TreeNode[] = [];
  for (let i = 0; i < TREE_COUNT; i++) {
    const bag = bootstrap(samples);
    forest.push(buildTree(bag, 0));
  }
  state.forest = forest;
}

export function trainRiskModel(features: RiskFeatures, targetRiskScore: number) {
  const yTrue = clamp(targetRiskScore, 0, 100);
  const x = toVector(features);
  samples.push({ x, y: yTrue });
  if (samples.length > MAX_SAMPLES) samples.shift();

  state.sampleCount += 1;
  if (state.sampleCount % RETRAIN_EVERY === 0) retrainForest();
  state.updatedAt = new Date().toISOString();
}

export function predictRiskModel(features: RiskFeatures): number | null {
  if (state.sampleCount < MIN_SAMPLES_FOR_PREDICT || state.forest.length === 0) return null;
  const x = toVector(features);
  const preds = state.forest.map((tree) => predictTree(tree, x));
  return Math.round(clamp(mean(preds), 0, 100));
}

export function getRiskModelStatus() {
  return {
    modelType: "random_forest",
    sampleCount: state.sampleCount,
    updatedAt: state.updatedAt,
    treeCount: state.forest.length,
    retrainEvery: RETRAIN_EVERY,
    minSamplesForPredict: MIN_SAMPLES_FOR_PREDICT,
    ready: state.sampleCount >= MIN_SAMPLES_FOR_PREDICT,
  };
}

