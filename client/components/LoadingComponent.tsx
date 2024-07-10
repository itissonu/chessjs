import React, { useState, useEffect } from 'react';
import Image from 'next/image';


const LoadingComponent = ({ error }:any) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 95) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 50); 

    return () => clearInterval(interval);
  }, []);


  return (
    <div className="flex justify-center items-center h-screen w-full flex-col">
      
      <div className="w-1/2 mt-4 ">
        <div className="h-2 bg-gray-300 rounded-l-full rounded-r-full">
          <div
            className="h-full bg-red-500 rounded-r-full rounded-l-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span>Loading..</span>
      </div>
      {error && (
        <div className="mt-4 text-red-500">
          Failed to establish WebSocket connection. Please try again.
        </div>
      )}
    </div>
  );
};

export default LoadingComponent;
