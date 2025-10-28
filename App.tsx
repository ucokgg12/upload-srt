
import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { SrtViewer } from './components/SrtViewer';
import { parseSrt } from './services/srtParser';
import type { Subtitle } from './types';

const App: React.FC = () => {
  const [subtitles, setSubtitles] = useState<Subtitle[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileSelect = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);
    setSubtitles(null);
    setFileName(null);

    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        if (typeof event.target?.result !== 'string') {
          throw new Error('Failed to read file content.');
        }
        const parsedSubtitles = parseSrt(event.target.result);
        if (parsedSubtitles.length === 0) {
          throw new Error('Could not find any subtitles in the file. Please check the file format.');
        }
        setSubtitles(parsedSubtitles);
        setFileName(file.name);
      } catch (e: any) {
        setError(e.message || 'An unexpected error occurred while parsing the file.');
        setSubtitles(null);
        setFileName(null);
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read the file. Please try again.');
      setIsLoading(false);
    };

    reader.readAsText(file);
  }, []);

  const handleReset = () => {
    setSubtitles(null);
    setFileName(null);
    setError(null);
  };
  
  const Header = () => (
    <header className="text-center p-4 md:p-6 border-b border-gray-700">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
          SRT File Viewer
        </h1>
        <p className="text-gray-400 mt-2">
          Upload and view your SubRip subtitle files instantly.
        </p>
    </header>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-2xl overflow-hidden transition-all duration-500">
          {subtitles ? (
            <SrtViewer subtitles={subtitles} fileName={fileName || ''} onReset={handleReset} />
          ) : (
            <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} error={error} />
          )}
        </div>
        <footer className="text-center text-gray-500 mt-8 text-sm">
            <p>&copy; {new Date().getFullYear()} SRT Viewer. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
