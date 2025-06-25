/**
 * @file PointCloud sideView - React Component
 * @createdate 2022-07-11
 * @author Ron <ron.f.luo@gmail.com>
 */
import {
  PointCloud,
  PointCloudAnnotation,
  OrthographicViewer,
  THybridToolName,
} from '@labelbee/lb-annotation';
import { getClassName } from '@/utils/dom';
import { PointCloudContainer } from '../PointCloudLayout';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { EPerspectiveView, IPointUnit, UpdatePolygonByDragList } from '@labelbee/lb-utils';
import { PointCloudContext } from '../PointCloudContext';
import { SizeInfoForView } from '../PointCloudInfos';
import { connect } from 'react-redux';
import { a2MapStateToProps, IA2MapStateProps } from '@/store/annotation/map';
import { usePointCloudViews } from '../hooks/usePointCloudViews';
import { useSingleBox } from '../hooks/useSingleBox';
import { useSphere } from '../hooks/useSphere';
import EmptyPage from '../components/EmptyPage';
import useSize from '@/hooks/useSize';
import { useTranslation } from 'react-i18next';
import { LabelBeeContext } from '@/store/ctx';
import ToolUtils from '@/utils/ToolUtils';
import { useZoom } from '@/components/pointCloudView/hooks/useZoom';
import TitleButton from '../components/TitleButton';

/**
 * Get the offset from canvas2d-coordinate to world coordinate
 * @param currentPos
 * @param size
 * @param zoom
 * @returns
 */
const TransferCanvas2WorldOffset = (
  currentPos: { x: number; y: number },
  size: { width: number; height: number },
  zoom = 1,
) => {
  const { width: w, height: h } = size;

  const canvasCenterPoint = {
    x: currentPos.x + (w * zoom) / 2, // 放大倍数之后的中心点的偏移量
    y: currentPos.y + (h * zoom) / 2,
  };

  const worldCenterPoint = {
    x: size.width / 2,
    y: size.height / 2,
  };

  return {
    offsetX: (worldCenterPoint.x - canvasCenterPoint.x) / zoom,
    offsetY: -(worldCenterPoint.y - canvasCenterPoint.y) / zoom,
  };
};

const updateSideViewByCanvas2D = (
  currentPos: { x: number; y: number },
  zoom: number,
  size: { width: number; height: number },
  rotation: number,
  SidePointCloud: PointCloud,
) => {
  const { offsetX, offsetY } = TransferCanvas2WorldOffset(currentPos, size, zoom);
  SidePointCloud.camera.zoom = zoom;
  if (currentPos) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const offsetXX = offsetX * cos;
    const offsetXY = offsetX * sin;
    const { x, y, z } = SidePointCloud.initCameraPosition;
    SidePointCloud.camera.position.set(x - offsetXX, y - offsetXY, z + offsetY);
  }
  SidePointCloud.camera.updateProjectionMatrix();
  SidePointCloud.render();
};

interface IProps {
  checkMode?: boolean;
}

const PointCloudSideView: React.FC<IA2MapStateProps & IProps> = ({ config, checkMode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { shareScene } = useContext(PointCloudContext);

  const viewer = useRef<OrthographicViewer>();

  useEffect(() => {
    if (ref.current) {
      viewer.current = new OrthographicViewer(ref.current!, shareScene, {
        axis: 'y',
      });
    }
    return () => {
      viewer.current?.dispose();
    };
  }, []);

  return (
    <PointCloudContainer
      className={getClassName('point-cloud-container', 'side-view')}
      title={<TitleButton title={t('SideView')} />}
      titleOnSurface={true}
      titleNonInteractive={true}
    >
      <div className={getClassName('point-cloud-container', 'bottom-view-content')}>
        <div className={getClassName('point-cloud-container', 'core-instance')} ref={ref} />
        {/* {!selectedBox && !selectedSphere && <EmptyPage />} */}
        <SizeInfoForView perspectiveView={EPerspectiveView.Left} />
      </div>
    </PointCloudContainer>
  );
};

export default connect(a2MapStateToProps, null, null, { context: LabelBeeContext })(
  PointCloudSideView,
);
