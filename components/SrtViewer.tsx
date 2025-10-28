
import React from 'react';
import type { Subtitle } from '../types';

interface SrtViewerProps {
  subtitles: Subtitle[];
  fileName: string;
  onReset: () => void;
}

const FileIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
);


export const SrtViewer: React.FC<SrtViewerProps> = ({ subtitles, fileName, onReset }) => {
  return (
    <div className="flex flex-col h-full max-h-[80vh]">
        <header className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
            <h2 className="text-xl font-semibold text-gray-200 truncate">
                <FileIcon />
                {fileName}
            </h2>
            <button
                onClick={onReset}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors text-sm"
            >
                Upload New File
            </button>
        </header>
        <div className="flex-grow p-4 overflow-y-auto bg-gray-900/50">
            <ul className="space-y-4">
            {subtitles.map((sub, index) => (
                <li key={sub.id} className="p-4 bg-gray-800 rounded-lg shadow-md flex flex-col md:flex-row gap-4">
                    <div className="flex-shrink-0 flex md:flex-col items-center md:items-start md:w-48">
                        <span className="font-bold text-blue-400 w-8 text-center md:text-left">{sub.id}</span>
                        <div className="text-xs text-gray-400 font-mono flex-grow text-center md:text-left">
                            <p>{sub.startTime}</p>
                            <p className="text-gray-500">→</p>
                            <p>{sub.endTime}</p>
                        </div>
                    </div>
                    <div className="flex-grow pt-2 md:pt-0 md:border-l md:pl-4 border-gray-700">
                        <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                            {sub.text}
                        </p>
                    </div>
                </li>
            ))}
            </ul>
      </div>
    </div>
  );
};
