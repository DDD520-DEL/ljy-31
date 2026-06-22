import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Record from './pages/Record';
import Schedule from './pages/Schedule';
import History from './pages/History';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import Community from './pages/Community';
import RouteResult from './pages/RouteResult';
import Calendar from './pages/Calendar';
import RouteLibrary from './pages/RouteLibrary';
import RecordTemplates from './pages/RecordTemplates';
import Achievements from './pages/Achievements';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/record" element={<Record />} />
          <Route path="/record/:id" element={<Record />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/history" element={<History />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/community" element={<Community />} />
          <Route path="/route" element={<RouteResult />} />
          <Route path="/route-library" element={<RouteLibrary />} />
          <Route path="/record-templates" element={<RecordTemplates />} />
          <Route path="/achievements" element={<Achievements />} />
        </Route>
      </Routes>
    </Router>
  );
}
