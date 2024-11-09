import React, { useState } from 'react';

const RealtimeKeypoints = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [keypoints, setKeypoints] = useState([
    'First keypoint example',
    'Second keypoint example',
    'Third keypoint example'
  ]);

  const handleMeetingStart = () => {
    setIsStarted(true);
  };

  const handleAISpeaker = () => {
    console.log('AI Speaker activated...');
  };

  const handleMeetingEnd = () => {
    setIsStarted(false);
  };

  const handleRealtimeKeypoints = () => {
    console.log('Starting realtime keypoints...');
  };

  return (
    <div className="flex w-full min-h-screen p-8 gap-12">
      {/* Left column - Video and Controls (3/5) */}
      <div className="w-3/5 flex flex-col space-y-8">
        {/* Video container with more padding */}
        <div className="w-full aspect-video bg-black rounded-xl p-4">
          {/* Video content would go here */}
        </div>
        
        {/* Centered buttons container */}
        <div className="flex flex-col items-center"> {/* 添加了flex-col和items-center */}
          <div className="flex flex-wrap gap-6 justify-center"> {/* 添加了justify-center */}
            <button
              onClick={handleMeetingStart}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg"
            >
              Meeting Start
            </button>
            
            <button
              onClick={handleAISpeaker}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg"
            >
              AI Speaker
            </button>
            
            <button
              onClick={handleMeetingEnd}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg"
            >
              Meeting End
            </button>
            
            <button
              onClick={handleRealtimeKeypoints}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg"
            >
              Realtime Keypoints Start
            </button>
          </div>
        </div>
      </div>

      {/* Right column - Keypoints Display (2/5) */}
      <div className="w-2/5 flex flex-col">
        {/* Title centered in the right column */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Realtime Keypoints</h1>
        </div>

        {/* Stack layout for keypoints with more spacing */}
        <div className="flex flex-col gap-4">
          {keypoints.length > 0 ? (
            keypoints.map((keypoint, index) => (
              <div 
                key={index} 
                className="p-4 bg-gray-100 rounded-lg shadow-md hover:bg-gray-200 transition-colors"
              >
                {keypoint}
              </div>
            ))
          ) : (
            <div className="p-4 text-gray-500 text-center">
              No keypoints generated yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimeKeypoints;
