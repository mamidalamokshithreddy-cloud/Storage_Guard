// Simple test component to verify CropShield integration works
import React from 'react';

const TestCropShield = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">CropShield Test Component</h1>
      <p className="text-gray-600">
        This is a simple test component to verify that the CropShield integration is working correctly.
      </p>
      <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
        <p className="text-green-800">
          ✅ CropShield component is loading successfully!
        </p>
      </div>
    </div>
  );
};

export default TestCropShield;
