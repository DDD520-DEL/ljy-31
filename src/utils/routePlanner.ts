import {
  RoadPrediction,
  RouteSegment,
  RouteOption,
  RoutePlanInput,
  RouteAvoidanceResult,
  TimeSlotRisk,
  RoadHourlyRisk,
  HeatmapRoadData,
} from '../types';
import { generateId } from './format';

const getRiskLevel = (probability: number): 'high' | 'medium' | 'low' => {
  if (probability >= 0.6) return 'high';
  if (probability >= 0.3) return 'medium';
  return 'low';
};

const generateMockSegments = (
  predictions: RoadPrediction[],
  origin: string,
  destination: string,
  routeCount: number
): RouteSegment[][] => {
  const allRoads = predictions.map((p) => p.roadName);
  
  if (allRoads.length < 3) {
    return [predictions.map((p, idx) => createSegment(p, idx, predictions.length))];
  }

  const routes: RouteSegment[][] = [];
  
  const mainRoute = generateRouteSegments(predictions, origin, destination, 'main');
  routes.push(mainRoute);

  if (routeCount >= 2 && allRoads.length > 4) {
    const altRoute = generateRouteSegments(predictions, origin, destination, 'alt1');
    routes.push(altRoute);
  }

  if (routeCount >= 3 && allRoads.length > 5) {
    const safeRoute = generateSafeRouteSegments(predictions, origin, destination);
    routes.push(safeRoute);
  }

  return routes;
};

const createSegment = (
  prediction: RoadPrediction,
  order: number,
  total: number
): RouteSegment => {
  const baseDistance = 1 + Math.random() * 2;
  const distance = Math.round(baseDistance * 10) / 10;
  const estimatedTime = Math.round(distance * 3 + Math.random() * 2);
  
  const highRiskTimes = prediction.predictedTimes
    .filter((t) => t.probability >= 0.5)
    .map((t) => t.averageTime);
  
  const lowRiskTimes = prediction.predictedTimes
    .filter((t) => t.probability < 0.3)
    .map((t) => t.averageTime);

  return {
    roadName: prediction.roadName,
    order,
    distance,
    estimatedTime,
    splashProbability: prediction.splashProbability,
    adjustedProbability: prediction.splashProbability,
    riskLevel: getRiskLevel(prediction.splashProbability),
    highRiskTimes: highRiskTimes.slice(0, 3),
    lowRiskTimes: lowRiskTimes.slice(0, 3),
  };
};

const generateRouteSegments = (
  predictions: RoadPrediction[],
  origin: string,
  destination: string,
  variant: string
): RouteSegment[] => {
  const shuffled = [...predictions].sort(() => (variant === 'alt1' ? 0.3 : 0.5) - Math.random());
  const count = Math.min(Math.floor(predictions.length * 0.6) + 2, predictions.length);
  const selected = shuffled.slice(0, Math.max(count, 3));
  
  return selected.map((prediction, idx) => createSegment(prediction, idx, selected.length));
};

const generateSafeRouteSegments = (
  predictions: RoadPrediction[],
  origin: string,
  destination: string
): RouteSegment[] => {
  const sorted = [...predictions].sort((a, b) => a.splashProbability - b.splashProbability);
  const count = Math.min(Math.floor(predictions.length * 0.7) + 1, predictions.length);
  const selected = sorted.slice(0, Math.max(count, 3));
  
  return selected.map((prediction, idx) => {
    const segment = createSegment(prediction, idx, selected.length);
    segment.distance = segment.distance * 1.2;
    segment.estimatedTime = Math.round(segment.estimatedTime * 1.15);
    return segment;
  });
};

export const generateRouteOptions = (
  predictions: RoadPrediction[],
  input: RoutePlanInput,
  weatherAdjustment: (prob: number) => number = (p) => p
): RouteOption[] => {
  const segmentSets = generateMockSegments(
    predictions,
    input.origin,
    input.destination,
    3
  );

  const routeNames = ['推荐路线', '备选路线', '安全路线'];
  const tags: Array<'推荐' | '最快' | '最安全' | '备选' | undefined> = ['推荐', '备选', '最安全'];

  return segmentSets.map((segments, idx) => {
    const adjustedSegments = segments.map((seg) => ({
      ...seg,
      adjustedProbability: weatherAdjustment(seg.splashProbability),
      riskLevel: getRiskLevel(weatherAdjustment(seg.splashProbability)),
    }));

    const totalDistance = Math.round(adjustedSegments.reduce((sum, s) => sum + s.distance, 0) * 10) / 10;
    const totalTime = adjustedSegments.reduce((sum, s) => sum + s.estimatedTime, 0);
    const overallRisk = adjustedSegments.reduce((sum, s) => sum + s.splashProbability, 0) / adjustedSegments.length;
    const adjustedOverallRisk = adjustedSegments.reduce((sum, s) => sum + s.adjustedProbability, 0) / adjustedSegments.length;
    
    const highRiskCount = adjustedSegments.filter((s) => s.riskLevel === 'high').length;
    const mediumRiskCount = adjustedSegments.filter((s) => s.riskLevel === 'medium').length;
    const lowRiskCount = adjustedSegments.filter((s) => s.riskLevel === 'low').length;

    const allTimes = adjustedSegments.flatMap((s) => s.lowRiskTimes);
    const bestTime = allTimes.length > 0 ? allTimes[Math.floor(allTimes.length / 2)] : undefined;
    const allHighTimes = adjustedSegments.flatMap((s) => s.highRiskTimes);
    const worstTime = allHighTimes.length > 0 ? allHighTimes[0] : undefined;

    return {
      id: generateId(),
      name: routeNames[idx] || `路线${idx + 1}`,
      segments: adjustedSegments,
      totalDistance,
      totalEstimatedTime: totalTime,
      overallRisk,
      adjustedOverallRisk,
      riskLevel: getRiskLevel(adjustedOverallRisk),
      highRiskSegments: highRiskCount,
      mediumRiskSegments: mediumRiskCount,
      lowRiskSegments: lowRiskCount,
      bestDepartureTime: bestTime,
      worstDepartureTime: worstTime,
      tag: tags[idx],
    };
  });
};

export const generateTimeSlotRisks = (
  predictions: RoadPrediction[],
  weatherAdjustment: (prob: number) => number = (p) => p
): TimeSlotRisk[] => {
  const timeSlots = [
    { label: '凌晨', start: 0, end: 6 },
    { label: '早高峰', start: 6, end: 9 },
    { label: '上午', start: 9, end: 12 },
    { label: '中午', start: 12, end: 14 },
    { label: '下午', start: 14, end: 17 },
    { label: '晚高峰', start: 17, end: 20 },
    { label: '晚间', start: 20, end: 24 },
  ];

  return timeSlots.map((slot) => {
    let totalRisk = 0;
    let count = 0;
    const highRiskRoads: string[] = [];
    const mediumRiskRoads: string[] = [];
    const lowRiskRoads: string[] = [];

    predictions.forEach((prediction) => {
      const slotPredictions = prediction.predictedTimes.filter(
        (t) => t.hour >= slot.start && t.hour < slot.end
      );
      
      if (slotPredictions.length > 0) {
        const avgProb = slotPredictions.reduce((sum, t) => sum + t.probability, 0) / slotPredictions.length;
        const adjustedProb = weatherAdjustment(avgProb);
        totalRisk += adjustedProb;
        count++;

        const risk = getRiskLevel(adjustedProb);
        if (risk === 'high') highRiskRoads.push(prediction.roadName);
        else if (risk === 'medium') mediumRiskRoads.push(prediction.roadName);
        else lowRiskRoads.push(prediction.roadName);
      } else {
        lowRiskRoads.push(prediction.roadName);
      }
    });

    const averageRisk = count > 0 ? totalRisk / count : 0;

    return {
      timeSlot: slot.label,
      startHour: slot.start,
      endHour: slot.end,
      averageRisk,
      highRiskRoads,
      mediumRiskRoads,
      lowRiskRoads,
    };
  });
};

export const generateRoadHourlyRisks = (
  predictions: RoadPrediction[],
  weatherAdjustment: (prob: number) => number = (p) => p
): RoadHourlyRisk[] => {
  return predictions.map((prediction) => {
    const hourlyRisk: Record<number, number> = {};
    
    for (let h = 0; h < 24; h++) {
      const hourPredictions = prediction.predictedTimes.filter(
        (t) => t.hour === h || (t.hour === h - 1 && t.minute > 30) || (t.hour === h + 1 && t.minute < 30)
      );
      
      if (hourPredictions.length > 0) {
        const avgProb = hourPredictions.reduce((sum, t) => sum + t.probability, 0) / hourPredictions.length;
        hourlyRisk[h] = weatherAdjustment(avgProb);
      } else {
        const baseRisk = prediction.splashProbability * 0.3;
        hourlyRisk[h] = weatherAdjustment(baseRisk);
      }
    }

    const overallRisk = weatherAdjustment(prediction.splashProbability);
    const peakHours = Object.entries(hourlyRisk)
      .filter(([_, risk]) => risk >= 0.5)
      .map(([hour]) => parseInt(hour, 10))
      .sort((a, b) => hourlyRisk[b] - hourlyRisk[a])
      .slice(0, 5);
    
    const safeHours = Object.entries(hourlyRisk)
      .filter(([_, risk]) => risk < 0.2)
      .map(([hour]) => parseInt(hour, 10))
      .sort((a, b) => a - b);

    return {
      roadName: prediction.roadName,
      hourlyRisk,
      overallRisk,
      peakHours,
      safeHours,
    };
  });
};

export const calculateRouteAvoidance = (
  predictions: RoadPrediction[],
  input: RoutePlanInput,
  weatherAdjustment: (prob: number) => number = (p) => p
): RouteAvoidanceResult => {
  const routes = generateRouteOptions(predictions, input, weatherAdjustment);
  const timeSlotRisks = generateTimeSlotRisks(predictions, weatherAdjustment);

  const bestRoute = [...routes].sort((a, b) => {
    const aScore = a.adjustedOverallRisk * 2 + a.totalEstimatedTime / 60;
    const bScore = b.adjustedOverallRisk * 2 + b.totalEstimatedTime / 60;
    return aScore - bScore;
  })[0];

  routes.forEach((route) => {
    if (bestRoute && route.id !== bestRoute.id) {
      route.savedProbability = bestRoute.adjustedOverallRisk - route.adjustedOverallRisk;
    }
  });

  return {
    input,
    routes,
    bestRouteId: bestRoute?.id || routes[0]?.id || '',
    timeSlotRisks,
    generatedAt: Date.now(),
  };
};

export const generateHeatmapRoadData = (
  predictions: RoadPrediction[],
  topN: number = 8,
  weatherAdjustment: (prob: number) => number = (p) => p
): HeatmapRoadData[] => {
  const topPredictions = [...predictions]
    .sort((a, b) => b.splashProbability - a.splashProbability)
    .slice(0, topN);

  return topPredictions.map((prediction) => {
    const hourlyData: Array<{ hour: number; risk: number }> = [];
    
    for (let h = 0; h < 24; h++) {
      const hourPredictions = prediction.predictedTimes.filter(
        (t) => t.hour === h || Math.abs(t.hour - h) === 1
      );
      
      let risk: number;
      if (hourPredictions.length > 0) {
        const maxProb = Math.max(...hourPredictions.map((t) => t.probability));
        risk = weatherAdjustment(maxProb);
      } else {
        risk = weatherAdjustment(prediction.splashProbability * 0.2);
      }
      
      hourlyData.push({ hour: h, risk });
    }

    return {
      roadName: prediction.roadName,
      hourlyData,
      overallRisk: weatherAdjustment(prediction.splashProbability),
    };
  });
};

export const findSafeDepartureTime = (
  predictions: RoadPrediction[],
  targetRoads: string[],
  preferredHour: number
): { time: string; risk: number; suggestion: string } => {
  const targetPredictions = predictions.filter((p) => targetRoads.includes(p.roadName));
  
  if (targetPredictions.length === 0) {
    return { time: '随时可出发', risk: 0, suggestion: '暂无该路段数据' };
  }

  let bestHour = preferredHour;
  let lowestRisk = Infinity;

  for (let h = 0; h < 24; h++) {
    let totalRisk = 0;
    let count = 0;
    
    targetPredictions.forEach((prediction) => {
      const nearbyTimes = prediction.predictedTimes.filter(
        (t) => Math.abs(t.hour - h) <= 1
      );
      
      if (nearbyTimes.length > 0) {
        totalRisk += Math.max(...nearbyTimes.map((t) => t.probability));
        count++;
      } else {
        totalRisk += prediction.splashProbability * 0.3;
        count++;
      }
    });

    const avgRisk = count > 0 ? totalRisk / count : 0.5;
    
    const hourDiff = Math.abs(h - preferredHour);
    const penalty = hourDiff * 0.02;
    const adjustedRisk = avgRisk + penalty;

    if (adjustedRisk < lowestRisk) {
      lowestRisk = adjustedRisk;
      bestHour = h;
    }
  }

  const actualRisk = lowestRisk - Math.abs(bestHour - preferredHour) * 0.02;
  const riskLevel = getRiskLevel(Math.max(0, actualRisk));
  
  let suggestion = '';
  if (riskLevel === 'high') {
    suggestion = '建议调整出行时间，该时段风险较高';
  } else if (riskLevel === 'medium') {
    suggestion = '该时段风险中等，注意避让';
  } else {
    suggestion = '该时段较为安全，放心出行';
  }

  return {
    time: `${String(bestHour).padStart(2, '0')}:00`,
    risk: Math.max(0, actualRisk),
    suggestion,
  };
};
