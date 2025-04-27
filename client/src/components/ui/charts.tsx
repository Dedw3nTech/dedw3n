import React from 'react';

interface ChartProps {
  className?: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      fill?: boolean;
    }[];
  };
}

// IMPORTANT: In a real application, we would use a charting library like Chart.js or Recharts
// This is a placeholder implementation for design purposes

export function BarChart({ className, data }: ChartProps) {
  return (
    <div className={`${className} relative`}>
      <div className="flex h-full flex-col justify-end gap-2">
        <div className="flex items-end gap-2 h-full pt-6 pb-10">
          {data.labels.map((label, i) => {
            // Get max value to calculate relative heights
            const maxValue = Math.max(...data.datasets[0].data);
            const value = data.datasets[0].data[i];
            const height = value > 0 ? (value / maxValue) * 100 : 0;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full rounded-t" 
                  style={{ 
                    height: `${height}%`, 
                    backgroundColor: Array.isArray(data.datasets[0].backgroundColor) 
                      ? data.datasets[0].backgroundColor[i] 
                      : data.datasets[0].backgroundColor || 'rgba(99, 102, 241, 0.8)'
                  }}
                ></div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            );
          })}
        </div>
        <div className="text-center text-sm font-medium">{data.datasets[0].label}</div>
      </div>
    </div>
  );
}

export function LineChart({ className, data }: ChartProps) {
  // This is a simplified representation
  return (
    <div className={`${className} relative`}>
      <div className="flex h-full flex-col justify-end gap-2">
        <div className="h-[85%] border-b border-l relative">
          <div className="absolute bottom-0 left-0 right-0 border-t border-dashed border-gray-200" style={{ height: '25%' }}></div>
          <div className="absolute bottom-0 left-0 right-0 border-t border-dashed border-gray-200" style={{ height: '50%' }}></div>
          <div className="absolute bottom-0 left-0 right-0 border-t border-dashed border-gray-200" style={{ height: '75%' }}></div>
          
          <div className="absolute inset-0 flex items-end">
            <svg className="w-full h-full overflow-visible">
              <polyline
                points={data.labels.map((_, i) => {
                  const maxValue = Math.max(...data.datasets[0].data);
                  const value = data.datasets[0].data[i];
                  const x = (i / (data.labels.length - 1)) * 100;
                  const y = 100 - (value / maxValue) * 100;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke={typeof data.datasets[0].borderColor === 'string' ? data.datasets[0].borderColor : '#3b82f6'}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          {data.labels.map((label, i) => (
            <div key={i}>{label}</div>
          ))}
        </div>
        <div className="text-center text-sm font-medium">{data.datasets[0].label}</div>
      </div>
    </div>
  );
}

export function AreaChart({ className, data }: ChartProps) {
  // A simplified area chart (like a line chart with fill)
  return (
    <div className={`${className} relative`}>
      <div className="flex h-full flex-col justify-end gap-2">
        <div className="h-[85%] border-b border-l relative">
          <div className="absolute bottom-0 left-0 right-0 border-t border-dashed border-gray-200" style={{ height: '25%' }}></div>
          <div className="absolute bottom-0 left-0 right-0 border-t border-dashed border-gray-200" style={{ height: '50%' }}></div>
          <div className="absolute bottom-0 left-0 right-0 border-t border-dashed border-gray-200" style={{ height: '75%' }}></div>
          
          <div className="absolute inset-0 flex items-end">
            <svg className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={typeof data.datasets[0].backgroundColor === 'string' ? data.datasets[0].backgroundColor : 'rgba(59, 130, 246, 0.5)'} />
                  <stop offset="100%" stopColor={typeof data.datasets[0].backgroundColor === 'string' ? data.datasets[0].backgroundColor : 'rgba(59, 130, 246, 0)'} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`
                  0,100 
                  ${data.labels.map((_, i) => {
                    const maxValue = Math.max(...data.datasets[0].data);
                    const value = data.datasets[0].data[i];
                    const x = (i / (data.labels.length - 1)) * 100;
                    const y = 100 - (value / maxValue) * 100;
                    return `${x},${y}`;
                  }).join(' ')} 
                  100,100
                `}
                fill="url(#areaGradient)"
                strokeWidth="0"
              />
              <polyline
                points={data.labels.map((_, i) => {
                  const maxValue = Math.max(...data.datasets[0].data);
                  const value = data.datasets[0].data[i];
                  const x = (i / (data.labels.length - 1)) * 100;
                  const y = 100 - (value / maxValue) * 100;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke={typeof data.datasets[0].borderColor === 'string' ? data.datasets[0].borderColor : '#3b82f6'}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          {data.labels.map((label, i) => (
            <div key={i}>{label}</div>
          ))}
        </div>
        <div className="text-center text-sm font-medium">{data.datasets[0].label}</div>
      </div>
    </div>
  );
}

export function PieChart({ className, data }: ChartProps) {
  // Simplified pie chart
  const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0);
  
  let cumulativePercent = 0;
  
  return (
    <div className={`${className} flex flex-col items-center justify-center`}>
      <div className="relative w-3/4 aspect-square">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {data.datasets[0].data.map((value, i) => {
            const percent = value / total;
            const startPercent = cumulativePercent;
            cumulativePercent += percent;
            
            // Convert percentages to angles for the SVG arc
            const startAngle = startPercent * 360;
            const endAngle = cumulativePercent * 360;
            
            // Convert angles to radians and calculate x,y coordinates
            const startAngleRad = (startAngle - 90) * (Math.PI / 180);
            const endAngleRad = (endAngle - 90) * (Math.PI / 180);
            
            const startX = 50 + 50 * Math.cos(startAngleRad);
            const startY = 50 + 50 * Math.sin(startAngleRad);
            const endX = 50 + 50 * Math.cos(endAngleRad);
            const endY = 50 + 50 * Math.sin(endAngleRad);
            
            // Large arc flag is 1 if angle > 180 degrees
            const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
            
            // Create SVG arc path
            const pathData = [
              `M 50 50`,
              `L ${startX} ${startY}`,
              `A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY}`,
              `Z`
            ].join(' ');
            
            const backgroundColor = Array.isArray(data.datasets[0].backgroundColor) 
                ? data.datasets[0].backgroundColor[i] 
                : 'hsl(' + (i * 60) + ', 70%, 60%)';
            
            return (
              <path
                key={i}
                d={pathData}
                fill={backgroundColor}
                stroke="#fff"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.labels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{
                backgroundColor: Array.isArray(data.datasets[0].backgroundColor) 
                  ? data.datasets[0].backgroundColor[i] 
                  : 'hsl(' + (i * 60) + ', 70%, 60%)'
              }}
            />
            <div className="text-xs">
              {label} ({Math.round((data.datasets[0].data[i] / total) * 100)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({ className, data }: ChartProps) {
  // Similar to pie chart but with a hole in the center
  const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0);
  
  let cumulativePercent = 0;
  
  return (
    <div className={`${className} flex flex-col items-center justify-center`}>
      <div className="relative w-3/4 aspect-square">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {data.datasets[0].data.map((value, i) => {
            const percent = value / total;
            const startPercent = cumulativePercent;
            cumulativePercent += percent;
            
            // Convert percentages to angles for the SVG arc
            const startAngle = startPercent * 360;
            const endAngle = cumulativePercent * 360;
            
            // Convert angles to radians and calculate x,y coordinates
            const startAngleRad = (startAngle - 90) * (Math.PI / 180);
            const endAngleRad = (endAngle - 90) * (Math.PI / 180);
            
            // For donut chart, we use smaller radius for inner edge
            const outerRadius = 50;
            const innerRadius = 30; // This creates the "hole"
            
            const startOuterX = 50 + outerRadius * Math.cos(startAngleRad);
            const startOuterY = 50 + outerRadius * Math.sin(startAngleRad);
            const endOuterX = 50 + outerRadius * Math.cos(endAngleRad);
            const endOuterY = 50 + outerRadius * Math.sin(endAngleRad);
            
            const startInnerX = 50 + innerRadius * Math.cos(endAngleRad);
            const startInnerY = 50 + innerRadius * Math.sin(endAngleRad);
            const endInnerX = 50 + innerRadius * Math.cos(startAngleRad);
            const endInnerY = 50 + innerRadius * Math.sin(startAngleRad);
            
            // Large arc flag is 1 if angle > 180 degrees
            const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
            
            // Create SVG arc path for donut
            const pathData = [
              `M ${startOuterX} ${startOuterY}`,
              `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuterX} ${endOuterY}`,
              `L ${startInnerX} ${startInnerY}`,
              `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endInnerX} ${endInnerY}`,
              `Z`
            ].join(' ');
            
            const backgroundColor = Array.isArray(data.datasets[0].backgroundColor) 
                ? data.datasets[0].backgroundColor[i] 
                : 'hsl(' + (i * 60) + ', 70%, 60%)';
            
            return (
              <path
                key={i}
                d={pathData}
                fill={backgroundColor}
                stroke="#fff"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Display total in the center */}
          <text 
            x="50" 
            y="50" 
            textAnchor="middle" 
            dominantBaseline="middle"
            className="text-xl font-bold"
            style={{ fill: 'currentColor' }}
          >
            {total}
          </text>
        </svg>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.labels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{
                backgroundColor: Array.isArray(data.datasets[0].backgroundColor) 
                  ? data.datasets[0].backgroundColor[i] 
                  : 'hsl(' + (i * 60) + ', 70%, 60%)'
              }}
            />
            <div className="text-xs">
              {label} ({Math.round((data.datasets[0].data[i] / total) * 100)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}