import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import WebsitePreview from './WebsitePreview';

const CardProject = ({ Img, Title, Description, Link: ProjectLink, id, Company, CompanyLink }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleLiveDemo = (e) => {
    if (!ProjectLink) {
      e.preventDefault();
      alert("Canlı demo bağlantısı mevcut değil.");
    }
  };

  const maxLength = 120;
  const shouldTruncate = Description.length > maxLength;
  const displayText = isExpanded || !shouldTruncate 
    ? Description 
    : Description.substring(0, maxLength) + "...";

  return (
    <div className="group relative w-full h-full">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-lg border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-purple-500/20 h-full flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
    
        <div className="relative p-5 z-10 flex flex-col h-full">
          <div className="relative overflow-hidden rounded-lg aspect-[16/10] bg-slate-900/80 shrink-0">
            {ProjectLink ? (
              <WebsitePreview url={ProjectLink} title={Title} />
            ) : (
              <img
                src={Img}
                alt={Title}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          
          <div className="mt-4 space-y-3 flex flex-col flex-1">
            <div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                {Title}
              </h3>
              {Company && (
                <p className="text-sm text-gray-400 mt-1">
                  <span className="text-gray-500">Geliştirildiği Yer:</span>{" "}
                  {CompanyLink ? (
                    <a
                      href={CompanyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline decoration-blue-400/40 underline-offset-2 transition-colors duration-200 hover:text-blue-300 hover:decoration-blue-300"
                    >
                      {Company}
                    </a>
                  ) : (
                    Company
                  )}
                </p>
              )}
            </div>
             
            <div className="space-y-2 flex-1">
              <p className="text-gray-300/80 text-sm leading-relaxed">
                {displayText}
              </p>
            </div>
            
            <div className="pt-4 flex items-center justify-between mt-auto">
              <div className="flex items-center gap-4">
                {shouldTruncate && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors duration-200 group/btn"
                  >
                    <span>
                      {isExpanded ? "Daha Az Göster" : "Devamını Oku"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 group-hover/btn:-translate-y-0.5 transition-transform duration-200" />
                    ) : (
                      <ChevronDown className="w-3 h-3 group-hover/btn:translate-y-0.5 transition-transform duration-200" />
                    )}
                  </button>
                )}
              </div>
              
              {ProjectLink ? (
                <a
                  href={ProjectLink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLiveDemo}
                  className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors duration-200"
                >
                  <span className="text-sm font-medium">Web Sitesi  </span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <span className="text-gray-500 text-sm">Web Sitesi Mevcut Değil</span>
              )}
            </div>
          </div>
          
          <div className="absolute inset-0 border border-white/0 group-hover:border-purple-500/50 rounded-xl transition-colors duration-300 -z-50"></div>
        </div>
      </div>
    </div>
  );
};

export default CardProject;
