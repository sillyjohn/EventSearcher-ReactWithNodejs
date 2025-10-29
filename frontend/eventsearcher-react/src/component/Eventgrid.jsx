import React, { Component } from 'react'

export class Eventgrid extends Component {
  render() {
    return (
      <div className="flex flex-col items-center justify-center ">
        {/* Large Search Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-gray-300 mb-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        
        {/* Title Text */}
        <h3 
            id="eventgrid-title" 
            className="text-lg font-medium text-gray-500 text-center"
        >
            Enter search criteria and click the Search button to find events. 
        </h3>
        
        <div id="eventgrid-results" className="w-full mt-8">
          {/* Render event cards here */}
        </div>
      </div>
    )
  }
}

export default Eventgrid