import React, { useState } from 'react';
import { Megaphone, Calendar, User, ChevronDown, ChevronUp } from 'lucide-react';
import { BroadcastMessage } from '../../types';

interface AnnouncementCardProps {
  broadcasts?: BroadcastMessage[];
  className?: string;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  broadcasts = [],
  className = ''
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const activeBroadcasts = broadcasts
    .filter(b => !b.expiresAt || b.expiresAt >= todayStr)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (activeBroadcasts.length === 0) return null;

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {activeBroadcasts.map((broadcast) => {
        const isExpanded = expandedId === broadcast.id;
        const isLongText = broadcast.content.length > 130;

        return (
          <div
            key={broadcast.id}
            className="bg-amber-50/90 border border-amber-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs transition-all hover:border-amber-300"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-200/80 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0 shadow-2xs mt-0.5">
                <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-amber-900" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-200 text-amber-950 text-[10px] font-extrabold uppercase tracking-wider border border-amber-300/70 shadow-2xs">
                    Pengumuman Resmi
                  </span>
                  <span className="text-[11px] font-semibold text-amber-800/80 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-700" />
                    {broadcast.date}
                  </span>
                  {broadcast.senderName && (
                    <span className="text-[11px] font-semibold text-amber-800/80 flex items-center gap-1 hidden xs:inline-flex">
                      <User className="w-3 h-3 text-amber-700" />
                      {broadcast.senderName}
                    </span>
                  )}
                </div>

                <h4 className="text-sm sm:text-base font-extrabold text-amber-950 tracking-tight leading-snug">
                  {broadcast.title}
                </h4>

                <div className="mt-1.5 text-xs sm:text-sm text-amber-900/90 leading-relaxed font-medium">
                  {isExpanded || !isLongText ? (
                    <p className="whitespace-pre-line">{broadcast.content}</p>
                  ) : (
                    <p className="line-clamp-2">{broadcast.content}</p>
                  )}
                </div>

                {isLongText && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(broadcast.id)}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-950 hover:underline cursor-pointer transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <span>Tutup Pengumuman</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>Lihat Selengkapnya</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnnouncementCard;
