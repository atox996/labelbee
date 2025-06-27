import { getClassName } from '@/utils/dom';
import React, { useContext, useEffect, useRef, useState } from 'react';
import HighlightVisible from '../components/HighlightVisible';
import { IFileItem, IMappingImg } from '@/types/data';
import { PointCloudContext } from '../PointCloudContext';
import { ImageViewer } from '@labelbee/lb-annotation';

const PointCloud2DSingleView = ({
  view2dData,
  setSelectedID,
  currentData,
  showEnlarge,
  checkMode = false,
  measureVisible,
}: {
  view2dData: IMappingImg;
  setSelectedID: (value: string | number) => void;
  currentData: IFileItem;
  showEnlarge: boolean;
  checkMode?: boolean;
  measureVisible?: boolean;
}) => {
  const ref = useRef(null);
  const { url, calib } = view2dData;
  const { shareScene } = useContext(PointCloudContext);

  const [visible, setVisible] = useState(false);

  // const viewer = useRef<ImageViewer>();
  // useEffect(() => {
  //   if (ref.current) {
  //     viewer.current = new ImageViewer(ref.current!, shareScene, { name: 'image', img: url });
  //   }
  //   return () => {
  //     viewer.current?.dispose();
  //   };
  // }, []);

  const highlightOnClick = async () => {
    setVisible(!visible);
  };

  return (
    <div className={getClassName('point-cloud-2d-image')} ref={ref}>
      {calib && (
        <HighlightVisible
          visible={visible}
          onClick={highlightOnClick}
          loading={false}
          style={{
            position: 'absolute',
            right: 16,
            top: 16,
            zIndex: showEnlarge ? -1 : 101,
          }}
        />
      )}
    </div>
  );
};

export default PointCloud2DSingleView;
