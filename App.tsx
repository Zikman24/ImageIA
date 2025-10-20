import React, { useState, useCallback, useRef } from 'react';
import { transformImage } from './services/geminiService';
import { STYLES } from './constants';
import { Style } from './types';
import Spinner from './components/Spinner';

const UploadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Style | string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStyle, setLoadingStyle] = useState<Style | string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [customStyleInput, setCustomStyleInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setTransformedImage(null);
        setSelectedStyle(null);
        setError(null);
      };
      reader.onerror = () => {
        setError('Échec de la lecture du fichier image.');
      };
      reader.readAsDataURL(file);
    } else {
      setError('Veuillez sélectionner un fichier image valide (PNG, JPEG, WEBP).');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };
  
  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleTransform = useCallback(async (style: Style | string) => {
    if (!originalImage || isLoading) {
      return;
    }
    
    const processedStyle = typeof style === 'string' ? style.trim() : style;
    if (!processedStyle) return;

    setIsLoading(true);
    setLoadingStyle(processedStyle);
    setError(null);

    try {
      const result = await transformImage(originalImage, processedStyle);
      setTransformedImage(result);
      setSelectedStyle(processedStyle);
      if (STYLES.includes(processedStyle as Style)) {
        setCustomStyleInput('');
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(`Une erreur est survenue : ${e.message}`);
      } else {
        setError('Une erreur inconnue est survenue lors de la transformation de l\'image.');
      }
    } finally {
      setIsLoading(false);
      setLoadingStyle(null);
    }
  }, [originalImage, isLoading]);
  
  const handleCustomStyleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      handleTransform(customStyleInput);
  };

  const handleDownload = () => {
    if (!transformedImage) return;
    const link = document.createElement('a');
    link.href = transformedImage;
    
    const mimeType = transformedImage.match(/data:(.*);/)?.[1] ?? 'image/png';
    const extension = mimeType.split('/')[1] ?? 'png';
    const safeStyleName = selectedStyle?.toString().toLowerCase().replace(/\s+/g, '-') || 'styled';

    link.download = `transformed-${safeStyleName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center my-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            IA de Transfert de Style d'Image
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Téléchargez votre image et regardez-la se transformer par la magie de l'IA.</p>
        </header>

        <main className="mt-12">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div
                className={`transition-all duration-500 ${!originalImage ? 'lg:col-span-3' : 'lg:col-span-1'}`}
              >
                {!originalImage ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                    className={`relative w-full h-96 flex flex-col justify-center items-center bg-gray-800/50 border-2 border-dashed rounded-2xl cursor-pointer hover:border-purple-400 transition-colors duration-300 ${isDragging ? 'border-purple-400 bg-gray-800' : 'border-gray-600'}`}
                  >
                     <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                    />
                    <div className="text-center text-gray-400 pointer-events-none">
                      <UploadIcon />
                      <p className="mt-4 font-semibold">Glissez-déposez une image ici</p>
                      <p className="text-sm text-gray-500 mt-1">ou cliquez pour sélectionner un fichier</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-2xl p-4 shadow-2xl w-full flex flex-col fade-in">
                    <h3 className="text-lg font-semibold text-gray-300 mb-3 text-center">Originale</h3>
                    <div className="aspect-square bg-gray-900/50 rounded-lg flex items-center justify-center flex-grow overflow-hidden">
                      <img src={originalImage} alt="Originale" className="object-contain w-full h-full" />
                    </div>
                     <button onClick={triggerFileSelect} className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                        Changer d'image
                      </button>
                  </div>
                )}
              </div>

              {originalImage && (
                <>
                  <div className="lg:col-span-1 bg-gray-800/50 rounded-2xl shadow-lg p-6 fade-in">
                      <h2 className="text-xl font-semibold mb-6 text-center text-purple-300">Sélectionnez un Style</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {STYLES.map((style) => (
                          <button
                            key={style}
                            onClick={() => handleTransform(style)}
                            disabled={isLoading}
                            className={`h-16 py-2 px-3 text-sm rounded-lg transition-all duration-200 border-2 flex items-center justify-center text-center disabled:cursor-not-allowed disabled:opacity-60 ${
                              selectedStyle === style
                                ? 'bg-purple-600 border-purple-400 font-bold'
                                : 'bg-gray-700 border-transparent hover:bg-gray-600'
                            }`}
                          >
                            {loadingStyle === style ? <Spinner /> : style}
                          </button>
                        ))}
                      </div>

                       <div className="relative flex py-4 items-center">
                        <div className="flex-grow border-t border-gray-700"></div>
                        <span className="flex-shrink mx-4 text-gray-500 text-sm">OU</span>
                        <div className="flex-grow border-t border-gray-700"></div>
                      </div>

                      <form onSubmit={handleCustomStyleSubmit}>
                         <div className="flex gap-2">
                           <input
                            type="text"
                            value={customStyleInput}
                            onChange={(e) => setCustomStyleInput(e.target.value)}
                            placeholder="Entrez un style personnalisé..."
                            className="flex-grow bg-gray-700 border-2 border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 disabled:opacity-60"
                            disabled={isLoading}
                          />
                          <button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-sm disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isLoading || !customStyleInput.trim()}
                          >
                            {loadingStyle === customStyleInput.trim() && customStyleInput.trim() ? <Spinner /> : 'Appliquer'}
                          </button>
                         </div>
                      </form>

                     {error && <p className="text-red-400 text-center mt-4 bg-red-900/50 p-3 rounded-lg">{error}</p>}
                  </div>

                  <div className="lg:col-span-1 bg-gray-800 rounded-2xl p-4 shadow-2xl w-full flex flex-col fade-in">
                    <h3 className="text-lg font-semibold text-gray-300 mb-3 text-center">Transformée</h3>
                    <div className="aspect-square bg-gray-900/50 rounded-lg flex items-center justify-center flex-grow overflow-hidden relative">
                       {isLoading && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col justify-center items-center z-10">
                          <Spinner />
                           <p className="text-gray-300 mt-2">Magie en cours...</p>
                        </div>
                      )}
                      {transformedImage ? (
                        <img src={transformedImage} alt="Transformée" className="object-contain w-full h-full" />
                      ) : (
                         !isLoading && <p className="text-center text-gray-500 p-4">L'image transformée apparaîtra ici</p>
                      )}
                    </div>
                    {transformedImage && !isLoading && (
                        <button
                            onClick={handleDownload}
                            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            <DownloadIcon />
                            Télécharger l'image
                        </button>
                    )}
                  </div>
                </>
              )}
           </div>
        </main>
      </div>
    </div>
  );
};

export default App;
