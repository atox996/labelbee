/*
 * @Author: Laoluo luozefeng@sensetime.com
 * @Date: 2022-06-22 11:08:31
 * @LastEditors: Laoluo luozefeng@sensetime.com
 * @LastEditTime: 2022-07-08 11:08:02
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
import { PointCloudContext } from '../PointCloudContext';
import { EPerspectiveView, IPointUnit, UpdatePolygonByDragList } from '@labelbee/lb-utils';
import { useSingleBox } from '../hooks/useSingleBox';
import { useSphere } from '../hooks/useSphere';
import { useZoom } from '../hooks/useZoom';
import { SizeInfoForView } from '../PointCloudInfos';
import { connect } from 'react-redux';
import { a2MapStateToProps, IA2MapStateProps } from '@/store/annotation/map';
import { usePointCloudViews } from '../hooks/usePointCloudViews';
import useSize from '@/hooks/useSize';
import EmptyPage from '../components/EmptyPage';
import { useTranslation } from 'react-i18next';
import { LabelBeeContext } from '@/store/ctx';
import ToolUtils from '@/utils/ToolUtils';
import TitleButton from '../components/TitleButton';

/**
 * 统一一下，将其拓展为 二维转换为 三维坐标的转换
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
    x: currentPos.x + (w * zoom) / 2,
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
const updateBackViewByCanvas2D = (
  currentPos: { x: number; y: number },
  zoom: number,
  size: { width: number; height: number },
  rotation: number,
  backPointCloud: PointCloud,
) => {
  const { offsetX, offsetY } = TransferCanvas2WorldOffset(currentPos, size, zoom);
  backPointCloud.camera.zoom = zoom;
  if (currentPos) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const offsetXX = offsetX * cos;
    const offsetXY = offsetX * sin;
    const { x, y, z } = backPointCloud.initCameraPosition;
    backPointCloud.camera.position.set(x + offsetXY, y - offsetXX, z + offsetY);
  }
  backPointCloud.camera.updateProjectionMatrix();
  backPointCloud.render();
};

interface IProps {
  checkMode?: boolean;
}

const PointCloudBackView = ({ currentData, config, checkMode }: IA2MapStateProps & IProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { shareScene } = useContext(PointCloudContext);

  const viewer = useRef<OrthographicViewer>();

  useEffect(() => {
    if (ref.current) {
      viewer.current = new OrthographicViewer(ref.current!, shareScene, {
        axis: '-x',
      });
    }
    return () => {
      viewer.current?.dispose();
    };
  }, []);

  return (
    <PointCloudContainer
      className={getClassName('point-cloud-container', 'back-view')}
      title={<TitleButton title={t('BackView')} />}
      titleOnSurface={true}
      titleNonInteractive={true}
    >
      <div className={getClassName('point-cloud-container', 'bottom-view-content')}>
        <div className={getClassName('point-cloud-container', 'core-instance')} ref={ref} />
        {/* {!selectedBox && !selectedSphere && <EmptyPage />} */}
        <SizeInfoForView perspectiveView={EPerspectiveView.Back} />
      </div>
    </PointCloudContainer>
  );
};

export default connect(a2MapStateToProps, null, null, { context: LabelBeeContext })(
  PointCloudBackView,
);
