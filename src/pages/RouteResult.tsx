import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Route,
  Shield,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Check,
  RefreshCw,
  TrendingDown,
  Droplets,
  Navigation,
  Zap,
  Clock as ClockIcon,
} from 'lucide-react';
import { usePredictions, useWeather, useGetWeatherAdjustment } from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { calculateRouteAvoidance, findSafeDepartureTime } from '../utils/routePlanner';
import { getProbabilityBgLight, getProbabilityColor } from '../utils/format';
import { cn } from '../lib/utils';
import { RouteOption, TimeSlotRisk } from '../types';

export default function RouteResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const predictions = usePredictions();
  const weather = useWeather();
  const getWeatherAdjustment = useGetWeatherAdjustment();
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(true);

  const searchParams = new URLSearchParams(location.search);
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const departureTime = searchParams.get('departureTime') || '';

  const routeResult = useMemo(() => {
    if (!origin || !destination) return null;

    const weatherAdjFn = (prob: number) => getWeatherAdjustment(prob).adjustedProbability;
    return calculateRouteAvoidance(predictions, { origin, destination, departureTime }, weatherAdjFn);
  }, [predictions, origin, destination, departureTime, getWeatherAdjustment]);

  useEffect(() => {
    if (routeResult) {
      setIsCalculating(false);
      setSelectedRouteId(routeResult.bestRouteId);
    }
  }, [routeResult]);

  const selectedRoute = routeResult?.routes.find((r) => r.id === selectedRouteId);

  const safeDeparture = useMemo(() => {
    if (!selectedRoute) return null;
    const roadNames = selectedRoute.segments.map((s) => s.roadName);
    const preferredHour = departureTime ? parseInt(departureTime.split(':')[0], 10) : new Date().getHours();
    return findSafeDepartureTime(predictions, roadNames, preferredHour);
  }, [selectedRoute, predictions, departureTime]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-amber-600';
      default: return 'text-emerald-600';
    }
  };

  const getRiskBgColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-100';
      case 'medium': return 'bg-amber-100';
      default: return 'bg-emerald-100';
    }
  };

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return '高风险';
      case 'medium': return '中风险';
      default: return '低风险';
    }
  };

  if (!origin || !destination) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Route className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">未找到路线信息</h3>
            <p className="text-slate-500 text-sm mb-6">请返回首页输入出发地和目的地</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors"
            >
              返回首页
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCalculating || !routeResult) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">正在计算最优路线...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-8">
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">路线规避建议</h1>
          <p className="text-slate-500 text-sm">
            {origin} <ArrowRight className="w-3 h-3 inline mx-1" /> {destination}
          </p>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-sky-500 to-blue-600 text-white border-0 overflow-hidden">
        <CardContent className="py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{origin}</span>
                  <ArrowRight className="w-4 h-4 text-sky-200" />
                  <span className="font-medium">{destination}</span>
                </div>
                <p className="text-sm text-sky-100">
                  共 {routeResult.routes.length} 条路线可选
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsCalculating(true);
                setTimeout(() => setIsCalculating(false), 500);
              }}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {safeDeparture && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-400/30 flex items-center justify-center flex-shrink-0">
                  <ClockIcon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-sky-100">建议出发时间</p>
                  <p className="font-semibold text-lg">
                    {safeDeparture.time}
                    <span className="text-sm font-normal text-sky-200 ml-2">
                      {safeDeparture.suggestion}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {Math.round(safeDeparture.risk * 100)}%
                  </p>
                  <p className="text-xs text-sky-200">溅水风险</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Route className="w-5 h-5 text-sky-500" />
          可选路线
        </h2>
        <div className="space-y-3">
          {routeResult.routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              isSelected={selectedRouteId === route.id}
              isBest={route.id === routeResult.bestRouteId}
              onClick={() => setSelectedRouteId(route.id)}
            />
          ))}
        </div>
      </div>

      {selectedRoute && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-500" />
              路线详情
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedRoute.segments.map((segment, idx) => (
              <div key={segment.roadName} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full',
                      getProbabilityColor(segment.adjustedProbability)
                    )}
                  />
                  {idx < selectedRoute.segments.length - 1 && (
                    <div className="w-0.5 flex-1 bg-slate-200 my-1" />
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">{segment.roadName}</span>
                    <span className={cn('text-sm font-medium', getRiskColor(segment.riskLevel))}>
                      {getRiskLabel(segment.riskLevel)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      约 {segment.estimatedTime} 分钟
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5" />
                      {Math.round(segment.adjustedProbability * 100)}% 溅水概率
                    </span>
                  </div>
                  {segment.lowRiskTimes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="text-xs text-slate-400">低风险时段:</span>
                      {segment.lowRiskTimes.map((time) => (
                        <span
                          key={time}
                          className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  )}
                  {segment.highRiskTimes.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="text-xs text-slate-400">高风险时段:</span>
                      {segment.highRiskTimes.map((time) => (
                        <span
                          key={time}
                          className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-500" />
            各时段风险分析
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {routeResult.timeSlotRisks.map((slot) => (
            <TimeSlotRow key={slot.timeSlot} slot={slot} />
          ))}
        </CardContent>
      </Card>

      <Card className="border-2 border-emerald-200 bg-emerald-50/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-emerald-800 mb-1">出行小贴士</p>
              <p className="text-sm text-emerald-700">
                选择低风险时段出行可有效降低被洒水车溅到的概率。
                如果必须经过高风险路段，建议减速慢行并保持安全距离。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface RouteCardProps {
  route: RouteOption;
  isSelected: boolean;
  isBest: boolean;
  onClick: () => void;
}

function RouteCard({ route, isSelected, isBest, onClick }: RouteCardProps) {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-amber-600';
      default: return 'text-emerald-600';
    }
  };

  const getTagColor = (tag?: string) => {
    switch (tag) {
      case '推荐': return 'bg-sky-500 text-white';
      case '最快': return 'bg-orange-500 text-white';
      case '最安全': return 'bg-emerald-500 text-white';
      case '备选': return 'bg-slate-500 text-white';
      default: return 'bg-slate-200 text-slate-600';
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition-all duration-300',
        isSelected
          ? 'border-sky-500 ring-2 ring-sky-500/20'
          : 'border-slate-100 hover:border-sky-200 hover:shadow-md'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn('px-2 py-0.5 rounded-lg text-xs font-medium', getTagColor(route.tag))}>
            {route.tag || '路线'}
          </span>
          {isBest && (
            <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-medium flex items-center gap-1">
              <Check className="w-3 h-3" />
              最优
            </span>
          )}
        </div>
        {route.savedProbability !== undefined && route.savedProbability !== 0 && (
          <span className={cn(
            'text-xs font-medium flex items-center gap-1',
            route.savedProbability > 0 ? 'text-emerald-600' : 'text-red-600'
          )}>
            <TrendingDown className="w-3 h-3" />
            {route.savedProbability > 0 ? '低' : '高'} {Math.abs(Math.round(route.savedProbability * 100))}%
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-2xl font-bold text-slate-800">
            {Math.round(route.adjustedOverallRisk * 100)}%
          </p>
          <p className="text-xs text-slate-500">溅水风险</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">
            {route.totalEstimatedTime}
            <span className="text-sm font-normal text-slate-500">分钟</span>
          </p>
          <p className="text-xs text-slate-500">预计用时</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">
            {route.totalDistance.toFixed(1)}
            <span className="text-sm font-normal text-slate-500">km</span>
          </p>
          <p className="text-xs text-slate-500">总距离</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-slate-500">{route.highRiskSegments} 高</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-500">{route.mediumRiskSegments} 中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500">{route.lowRiskSegments} 低</span>
          </div>
          {route.bestDepartureTime && (
            <span className="ml-auto text-xs text-emerald-600 font-medium">
              建议 {route.bestDepartureTime} 出发
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TimeSlotRow({ slot }: { slot: TimeSlotRisk }) {
  const riskColor = slot.averageRisk >= 0.6
    ? 'text-red-600'
    : slot.averageRisk >= 0.3
    ? 'text-amber-600'
    : 'text-emerald-600';

  const riskBgColor = slot.averageRisk >= 0.6
    ? 'bg-red-100'
    : slot.averageRisk >= 0.3
    ? 'bg-amber-100'
    : 'bg-emerald-100';

  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-sm font-medium text-slate-700 flex-shrink-0">
        {slot.timeSlot}
      </div>
      <div className="flex-1">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getProbabilityColor(slot.averageRisk))}
            style={{ width: `${Math.round(slot.averageRisk * 100)}%` }}
          />
        </div>
      </div>
      <div className={cn('text-sm font-medium w-12 text-right', riskColor)}>
        {Math.round(slot.averageRisk * 100)}%
      </div>
      <div className={cn('px-2 py-0.5 rounded text-xs font-medium', riskBgColor, riskColor)}>
        {slot.highRiskRoads.length > 0 ? `${slot.highRiskRoads.length}条高风险` : '安全'}
      </div>
    </div>
  );
}
