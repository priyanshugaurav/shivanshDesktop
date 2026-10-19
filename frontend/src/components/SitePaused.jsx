import React from 'react';

const SitePaused = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900">
          Site Paused
        </h1>
        <p className="text-lg sm:text-xl font-medium text-gray-600">
          Free limit exceeded
        </p>
        <p className="text-sm text-gray-400">
          This site is currently inactive because the free usage limit has been reached. Please contact the administrator.
        </p>
      </div>
    </div>
  );
};

export default SitePaused;
