/*
 * @Author: Laoluo luozefeng@sensetime.com
 * @Date: 2022-06-22 11:08:31
 * @LastEditors: Laoluo luozefeng@sensetime.com
 */
import { getClassName } from '@/utils/dom';
import { FooterDivider } from '@/views/MainView/toolFooter';
import { ZoomController } from '@/views/MainView/toolFooter/ZoomController';
import { DownSquareOutlined, UpSquareOutlined, LeftOutlined } from '@ant-design/icons';
import { OverheadViewer } from '@labelbee/lb-annotation';
import {
  IPolygonData,
  PointCloudUtils,
  UpdatePolygonByDragList,
  IPointUnit,
  ILine,
} from '@labelbee/lb-utils';
import { EPointCloudBoxRenderTrigger } from '@/utils/ToolPointCloudBoxRenderHelper';
import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PointCloudContext } from '../PointCloudContext';
import { useRotate } from '../hooks/useRotate';
import { useRotateEdge } from '../hooks/useRotateEdge';
import { useSingleBox } from '../hooks/useSingleBox';
import { PointCloudContainer } from '../PointCloudLayout';
import { BoxInfos, PointCloudValidity } from '../PointCloudInfos';
import { usePolygon } from '../hooks/usePolygon';
import { useSphere } from '../hooks/useSphere';
import { useZoom } from '../hooks/useZoom';
import { Slider } from 'antd';
import { a2MapStateToProps, IA2MapStateProps, IAnnotationStateProps } from '@/store/annotation/map';
import { connect } from 'react-redux';
import { usePointCloudViews } from '../hooks/usePointCloudViews';
import useSize from '@/hooks/useSize';
import { useTranslation } from 'react-i18next';
import { LabelBeeContext } from '@/store/ctx';
import { jsonParser } from '@/utils';
import { DrawLayerSlot } from '@/types/main';
import ToolUtils from '@/utils/ToolUtils';
import _ from 'lodash';
import PointCloudSizeSlider from '../components/PointCloudSizeSlider';
import { useHistory } from '../hooks/useHistory';
import TitleButton from '../components/TitleButton';
import { useDebounceFn } from 'ahooks';

/**
 * Get the offset from canvas2d-coordinate to world coordinate (Top View)
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

const TopViewToolbar = ({ currentData }: IAnnotationStateProps) => {
  const { zoom, zoomIn, zoomOut, initialPosition } = useZoom();
  const { selectNextBox, selectPrevBox } = useSingleBox();
  const { switchToNextSphere } = useSphere();
  const { updateRotate } = useRotate({ currentData });
  const { updateRotateEdge } = useRotateEdge({ currentData });
  const ptCtx = useContext(PointCloudContext);
  const { topViewInstance } = ptCtx;

  const currentToolName = ptCtx?.topViewInstance?.toolScheduler?.getCurrentToolName();

  const clockwiseRotate = () => {
    updateRotate(-Number(ptCtx.rectRotateSensitivity));
  };
  const anticlockwiseRotate = () => {
    updateRotate(ptCtx.rectRotateSensitivity);
  };

  const reverseRotate = () => {
    updateRotateEdge(-90);
  };

  return (
    <>
      <PointCloudSizeSlider
        onChange={(v: number) => {
          topViewInstance?.pointCloudInstance?.updatePointSize({ customSize: v });
        }}
      />
      <span
        onClick={anticlockwiseRotate}
        className={getClassName('point-cloud', 'rotate-reserve')}
      />
      <span onClick={clockwiseRotate} className={getClassName('point-cloud', 'rotate')} />
      <span onClick={reverseRotate} className={getClassName('point-cloud', 'rotate-90')} />
      <FooterDivider />
      <UpSquareOutlined
        onClick={() => {
          // if (currentToolName === EToolName.Point) {
          //   switchToNextSphere(ESortDirection.descend);
          //   return;
          // }
          selectPrevBox(true);
        }}
        className={getClassName('point-cloud', 'prev')}
      />
      <DownSquareOutlined
        onClick={() => {
          // if (currentToolName === EToolName.Point) {
          //   switchToNextSphere(ESortDirection.ascend);
          //   return;
          // }
          selectNextBox(true);
        }}
        className={getClassName('point-cloud', 'next')}
      />
      <FooterDivider />
      <ZoomController
        initialPosition={initialPosition}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        zoom={zoom}
      />
    </>
  );
};

/**
 * Slider for filtering Z-axis points
 */
const ZAxisSlider = ({
  setZAxisLimit,
  zAxisLimit,
  checkMode,
}: {
  setZAxisLimit: (value: number) => void;
  zAxisLimit: number;
  checkMode?: boolean;
}) => {
  if (checkMode) {
    return null;
  }

  return (
    <div style={{ position: 'absolute', top: 128, right: 8, height: '50%', zIndex: 20 }}>
      <Slider
        vertical
        step={0.5}
        max={10}
        min={0.5}
        defaultValue={zAxisLimit}
        onAfterChange={(v: number) => {
          setZAxisLimit(v);
        }}
      />
    </div>
  );
};

interface IProps extends IA2MapStateProps {
  drawLayerSlot?: DrawLayerSlot;
  checkMode?: boolean;
  intelligentFit?: boolean;
  setIsEnlargeTopView: (value: boolean) => void;
  isEnlargeTopView: boolean;
  onExitZoom: () => void;
}

const PointCloudTopView: React.FC<IProps> = ({
  currentData,
  imgList,
  stepInfo,
  drawLayerSlot,
  checkMode,
  intelligentFit,
  setIsEnlargeTopView,
  isEnlargeTopView,
  onExitZoom,
  highlightAttribute,
}) => {
  const [annotationPos, setAnnotationPos] = useState({ zoom: 1, currentPos: { x: 0, y: 0 } });
  const ref = useRef<HTMLDivElement>(null);
  const config = jsonParser(stepInfo.config);
  const { t } = useTranslation();
  const { shareScene } = useContext(PointCloudContext);

  const [zAxisLimit, setZAxisLimit] = useState<number>(10);

  const viewer = useRef<OverheadViewer>();

  useEffect(() => {
    if (ref.current) {
      viewer.current = new OverheadViewer(ref.current!, shareScene);
    }
    return () => {
      viewer.current?.dispose();
    };
  }, []);

  return (
    <PointCloudContainer
      className={getClassName('point-cloud-container', 'top-view')}
      title={
        isEnlargeTopView ? (
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <LeftOutlined
              style={{ cursor: 'pointer', marginRight: '12px' }}
              onClick={() => {
                onExitZoom();
              }}
            />
            <span>{t('TopView')}</span>

            <BoxInfos
              checkMode={checkMode}
              config={config}
              style={{ display: 'flex', position: 'initial', margin: '0px 20px' }}
            />
          </div>
        ) : (
          <TitleButton
            title={t('TopView')}
            onClick={() => {
              setIsEnlargeTopView(true);
            }}
          />
        )
      }
      toolbar={<TopViewToolbar currentData={currentData} />}
    >
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%' }} ref={ref}>
          {drawLayerSlot?.(annotationPos)}
        </div>

        {!isEnlargeTopView && <BoxInfos checkMode={checkMode} config={config} />}
        <ZAxisSlider checkMode={checkMode} zAxisLimit={zAxisLimit} setZAxisLimit={setZAxisLimit} />
        <PointCloudValidity />
      </div>
    </PointCloudContainer>
  );
};

export default connect(a2MapStateToProps, null, null, { context: LabelBeeContext })(
  PointCloudTopView,
);
