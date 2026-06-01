"use client";

import { SGG_CODES } from "@/lib/constants";

interface FilterBarProps {
  sggCd: string;
  startMonth: string;
  endMonth: string;
  onChange: (key: string, value: string) => void;
}

export default function FilterBar({ sggCd, startMonth, endMonth, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">지역</label>
        <select
          value={sggCd}
          onChange={(e) => onChange("sggCd", e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전국</option>
          {SGG_CODES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">시작월</label>
        <input
          type="month"
          value={startMonth}
          onChange={(e) => onChange("startMonth", e.target.value.replace("-", ""))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">종료월</label>
        <input
          type="month"
          value={endMonth}
          onChange={(e) => onChange("endMonth", e.target.value.replace("-", ""))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
