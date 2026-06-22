import { Star, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import PredictionCard from '../PredictionCard';
import { useFavoritePredictions } from '../../store/useAppStore';

export default function FavoriteRoadsWidget() {
  const navigate = useNavigate();
  const favoritePredictions = useFavoritePredictions();

  if (favoritePredictions.length === 0) {
    return (
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <CardTitle className="text-sm">收藏路段预测</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 text-center py-4">暂无收藏路段</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-md">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <CardTitle className="text-slate-800 text-sm">收藏路段预测</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                共 {favoritePredictions.length} 个收藏路段
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/schedule')}
            className="text-amber-600 text-xs font-medium flex items-center gap-0.5 hover:gap-1 transition-all px-2 py-1 rounded-lg hover:bg-amber-100/50"
          >
            管理
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {favoritePredictions.map((prediction) => (
          <PredictionCard
            key={prediction.roadName}
            prediction={prediction}
            highlight={false}
            onClick={() => navigate('/schedule')}
          />
        ))}
      </CardContent>
    </Card>
  );
}
