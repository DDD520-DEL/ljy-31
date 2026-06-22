import { useState } from 'react';
import { Route, MapPin, Navigation, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';

export default function RoutePlannerWidget() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const handlePlanRoute = () => {
    const params = new URLSearchParams();
    if (origin.trim()) params.set('origin', origin.trim());
    if (destination.trim()) params.set('destination', destination.trim());
    navigate(`/route?${params.toString()}`);
  };

  return (
    <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-100">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-md">
            <Route className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle>路线规避建议</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              输入起点终点，规划安全出行路线
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="出发地..."
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none text-sm text-slate-800 placeholder-slate-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-red-600" />
          </div>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="目的地..."
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none text-sm text-slate-800 placeholder-slate-400"
          />
        </div>
        <button
          onClick={handlePlanRoute}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Navigation className="w-4 h-4" />
          规划安全路线
          <ArrowRight className="w-4 h-4" />
        </button>
      </CardContent>
    </Card>
  );
}
