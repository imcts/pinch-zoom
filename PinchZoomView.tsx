import React, { FC, useEffect, useRef, useState } from 'react';
import './static/css/index.css';
import PinchZoom from './model/PinchZoom';

const PinchZoomView: FC = () => {
  const container = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState<PinchZoom>();

  useEffect(() => {
    if (zoom) {
      return;
    }
    if (!container.current) {
      return;
    }
    if (!image.current) {
      return;
    }
    setZoom(new PinchZoom(container.current, image.current).run());
  }, [zoom, container, image, setZoom]);

  useEffect(() => {
    return () => {
      if (!zoom) {
        return;
      }
      zoom.clear();
    };
  }, [zoom]);

  return (
    <div className="wrapper">
      <div className="content">
        <div ref={container} className="image">
          <img
            ref={image}
            src="./static/image/image2.jpeg"
            style={{
              transform: 'translate(0px, 0px) scale(1)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PinchZoomView;
