'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface CourseEntry { code: string; name: string; category: string; }

export default function SchoolMap({ schools, courses, schoolData, coords, selCourses }: {
  schools: string[]; courses: CourseEntry[];
  schoolData: Map<string, Map<string, number>>;
  coords: Record<string, [number, number]> | null; selCourses: string[];
}) {
  const visibleCourses = selCourses.length > 0 ? courses.filter(c => selCourses.includes(c.code)) : courses.slice(0, 10);

  const markers: { pos: [number, number]; name: string; total: number; color: string; details: string }[] = [];

  for (const school of schools) {
    const pos = coords?.[school];
    if (!pos) continue;
    const cm = schoolData.get(school);
    if (!cm) continue;
    let total = 0;
    const parts: string[] = [];
    for (const c of visibleCourses) {
      const v = cm.get(c.code) || 0;
      if (v > 0) { total += v; parts.push(`${c.name}: ${v}`); }
    }
    if (total === 0) continue;
    markers.push({ pos, name: school, total, color: '#3b82f6', details: parts.join(', ') });
  }

  const maxTotal = Math.max(1, ...markers.map(m => m.total));

  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ height: 550 }}>
      <MapContainer center={[-33.4, 150.5]} zoom={7} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {markers.map((m, i) => (
          <CircleMarker key={i} center={m.pos} radius={Math.max(4, Math.sqrt(m.total / maxTotal) * 25)}
            pathOptions={{ fillColor: m.color, color: m.color, fillOpacity: 0.6, weight: 1 }}>
            <Popup><strong>{m.name}</strong><br />Total: {m.total}<br /><small>{m.details}</small></Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
